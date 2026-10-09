import contractRenewable from '../fixtures/renewable_contract.json';
import i18n from '../support/i18n';
import moment from 'moment';
import properties from '../fixtures/properties.json';
import tenantFixture from '../fixtures/renewable_tenant.json';
import userWithCompanyAccount from '../fixtures/user_admin_company_account.json';

const t = i18n.getFixedT(userWithCompanyAccount.locale);

// A 12-month renewable lease that started 18 months ago: it lapsed 6 months
// ago, so browsing the current month's rents must roll it forward by exactly
// one lease duration (reconduction tacite).
const begin = moment().startOf('month').subtract(18, 'months');
const originalEnd = moment(begin).add(12, 'months').subtract(1, 'day');
const renewedEnd = moment(originalEnd).add(12, 'months');

const tenant = {
  ...tenantFixture,
  lease: {
    contract: contractRenewable.name,
    beginDate: begin.format('DD/MM/YYYY'),
    properties: [
      {
        name: properties[0].name,
        expense: {
          title: 'charges locatives',
          amount: 30
        },
        entryDate: begin.format('DD/MM/YYYY'),
        exitDate: originalEnd.format('DD/MM/YYYY')
      }
    ]
  }
};

describe('Tacit renewal', () => {
  before(() => {
    cy.resetAppData();
    cy.signUp(userWithCompanyAccount);
    cy.signIn(userWithCompanyAccount);
    cy.checkPage('firstaccess');
    cy.registerLandlord(userWithCompanyAccount);

    cy.createContractFromStepper(contractRenewable);
    cy.navAppMenu('dashboard');
    cy.addPropertyFromStepper(properties[0]);
    cy.navAppMenu('dashboard');
    cy.addTenantFromStepper(tenant);
  });

  it('renews the lapsed lease when rents are browsed and bills rent + charges', () => {
    cy.intercept('GET', '**/api/v2/rents/**').as('getRents');
    cy.navAppMenu('rents');

    cy.wait('@getRents').then(({ response }) => {
      expect(response.statusCode).to.eq(200);
      const rent = response.body.rents.find(
        ({ occupant }) => occupant.name === tenant.name
      );
      expect(rent, 'a rent generated for the current month').to.not.be
        .undefined;
      // the renewed term bills the rent and the charges (100 + 30), not the
      // rent alone
      expect(rent.totalWithoutBalanceAmount).to.eq(130);
    });
    cy.contains(tenant.name).should('be.visible');
  });

  it('shows the renewal on the lease overview', () => {
    cy.navAppMenu('tenants');
    cy.searchResource(tenant.name);
    cy.openResource(tenant.name);

    // still running (not "lease ended"), flagged as automatically renewed
    cy.contains(t('In progress (automatic renewal)')).should('be.visible');
    // the end date rolled forward by one lease duration
    cy.contains(renewedEnd.format('DD/MM/YYYY')).should('be.visible');
    // one renewal recorded in the audit trail
    cy.contains(t('Renewals')).parent().should('contain.text', '1');
  });

  it('keeps the renewed end date when the lease form is edited and saved', () => {
    // regression: the lease form used to snap the end date back to
    // begin + one lease duration, breaking validation and dropping the
    // renewed terms on save
    cy.contains('button', t('Edit')).click();
    cy.get('[role=dialog]').contains('button', t('Continue')).click();

    cy.get('button[role=tab]').contains(t('Lease')).click();
    cy.get('input[name=endDate]').should(
      'have.value',
      renewedEnd.format('DD/MM/YYYY')
    );

    cy.intercept('PATCH', '**/api/v2/tenants/**').as('updateTenant');
    cy.get('[data-cy=submit]').click();
    cy.wait('@updateTenant').its('response.statusCode').should('eq', 200);

    // the renewal survived the round trip
    cy.reload();
    cy.contains(renewedEnd.format('DD/MM/YYYY')).should('be.visible');
    cy.contains(t('Renewals')).parent().should('contain.text', '1');
  });
});
