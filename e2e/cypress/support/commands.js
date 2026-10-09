// ***********************************************
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
import i18n from './i18n';
import moment from 'moment';

Cypress.Commands.add('resetAppData', () => {
  const apiBaseUrl = Cypress.env('GATEWAY_BASEURL');
  cy.request('DELETE', `${apiBaseUrl}/api/reset`);
});

Cypress.Commands.add('signIn', ({ email, password }) => {
  cy.visit('/signin');
  // in demo mode the form comes pre-filled with the demo credentials:
  // replace them, never append
  cy.get('input[name=email]').clear();
  cy.get('input[name=email]').type(email);
  cy.get('input[name=password]').clear();
  cy.get('input[name=password]').type(password);
  cy.get('[data-cy=submit]').click();
});

Cypress.Commands.add('signOut', () => {
  cy.get('[data-cy=appMenu]').click();
  cy.get('[data-cy=signoutNav]').click();
});

Cypress.Commands.add('signUp', ({ firstName, lastName, email, password }) => {
  cy.visit('/signup');
  cy.get('input[name=firstName]').type(firstName);
  cy.get('input[name=lastName]').type(lastName);
  cy.get('input[name=email]').type(email);
  cy.get('input[name=password]').type(password);
  cy.get('[data-cy=submit]').click();
});

Cypress.Commands.add(
  'registerLandlord',
  ({ orgName, locale, currency, company }) => {
    cy.get('[data-cy=companyFalse]').click();
    cy.get('input[name=name]').type(orgName);
    cy.selectField('locale', locale);
    cy.selectField('currency', currency);
    if (company) {
      const { name, legalRepresentative, legalStructure, ein, capital } =
        company;
      cy.get('[data-cy=companyTrue]').click();
      cy.get('input[name=legalRepresentative]').type(legalRepresentative);
      cy.get('input[name=legalStructure]').type(legalStructure);
      cy.get('input[name=company]').type(name);
      cy.get('input[name=ein]').type(ein);
      cy.get('input[name=capital]').type(capital);
    }
    cy.get('[data-cy=submit]').click();
  }
);

Cypress.Commands.add(
  'createContractFromStepper',
  ({ name, description, timeRange, numberOfTerms, renewable, templates = [] }) => {
    cy.get('[data-cy=shortcutCreateContract]').click();
    cy.get('input[name=name]').type(name);
    cy.get('[data-cy=submitContract]').click();
    // the description is a TextField, which always renders an input
    cy.get('input[name=description]').type(description);
    cy.selectField('timeRange', timeRange);
    cy.get('input[name=numberOfTerms]').type(numberOfTerms);
    if (renewable) {
      // the lease form has a single checkbox: the tacit renewal flag
      cy.get('button[role=checkbox]').click();
      cy.get('button[role=checkbox]').should(
        'have.attr',
        'data-state',
        'checked'
      );
    }
    cy.get('[data-cy=submit]').click();
    templates.map(({ type, ...template }) => {
      if (type === 'text') {
        const { title, content } = template;
        cy.get('[data-cy=addTextDocument]').click();
        cy.get('input[name=title]').clear();
        cy.get('input[name=title]').type(title);
        cy.get('[data-cy="savingTextDocument"]').should('not.exist');
        cy.get('[data-cy="savedTextDocument"]').should('not.exist');
        cy.get('.ProseMirror').type(content);
        cy.get('[data-cy="savingTextDocument"]').should('not.exist');
        cy.get('[data-cy="savedTextDocument"]').should('not.exist');
        cy.get('[data-cy=close]').click();
      } else if (type === 'fileDescriptor') {
        const {
          title,
          description,
          hasExpiryDate,
          required,
          requiredOnceContractTerminated,
          optional
        } = template;
        cy.get('[data-cy=addFileDescriptor]').click();
        cy.get('input[name=name]').type(title);
        cy.get('input[name=description]').type(description);
        if (hasExpiryDate) {
          cy.get('div:has(>input[name=hasExpiryDate]) > button').click();
        }
        if (required) {
          cy.get('[data-cy=fileRequired]').click();
        } else if (requiredOnceContractTerminated) {
          cy.get('[data-cy=fileRequiredOnceContractTerminated]').click();
        } else if (optional) {
          cy.get('[data-cy=fileOptional]').click();
        }
        cy.get('[data-cy=submitFileDescriptor]').click();
      }
    });
    cy.get('[data-cy=submit]').click();
  }
);

Cypress.Commands.add(
  'addPropertyFromStepper',
  ({ name, type, description, surface, phone, digiCode, address, rent }) => {
    cy.get('[data-cy=shortcutAddProperty]').click();
    cy.get('input[name=name]').type(name);
    cy.get('[data-cy=submitProperty]').click();
    cy.contains(i18n.getFixedT('fr-FR')('Property information'));
    cy.selectFieldText(
      'type',
      i18n.getFixedT('fr-FR')(type.replace(/^./, type[0].toUpperCase()))
    );
    cy.get('input[name=rent]').type(rent);
    cy.get('input[name=description]').type(description);
    cy.get('input[name=surface]').type(surface);
    cy.get('input[name=phone]').type(phone);
    cy.get('input[name=digicode]').type(digiCode);
    if (address) {
      const { street1, street2, zipCode, city, state, country } = address;
      cy.get('input[name="address.street1"]').type(street1);
      if (street2) {
        cy.get('input[name="address.street2"]').type(street2);
      }
      cy.get('input[name="address.zipCode"]').type(zipCode);
      cy.get('input[name="address.city"]').type(city);
      cy.get('input[name="address.state"]').type(state);
      cy.get('input[name="address.country"]').type(country);
    }
    cy.get('[data-cy=submit]').click();
  }
);

Cypress.Commands.add(
  'addTenantFromStepper',
  ({ name, isCompany, address, contacts, lease, billing, documents }) => {
    cy.get('[data-cy=shortcutAddTenant]').click();
    cy.get('input[name=name]').type(name);
    cy.get('[data-cy=submitTenant]').click();
    if (isCompany) {
      cy.get('[data-cy=tenantIsBusinessAccount]').click();
    } else {
      cy.get('[data-cy=tenantIsPersonalAccount]').click();
    }
    if (address) {
      const { street1, street2, zipCode, city, state, country } = address;
      cy.get('input[name="address.street1"]').type(street1);
      if (street2) {
        cy.get('input[name="address.street2"]').type(street2);
      }
      cy.get('input[name="address.zipCode"]').type(zipCode);
      cy.get('input[name="address.city"]').type(city);
      cy.get('input[name="address.state"]').type(state);
      cy.get('input[name="address.country"]').type(country);
    }
    contacts.forEach(({ name, email, phone }, index) => {
      if (index > 0) {
        cy.get('button[data-cy=addContactsItem]').click();
      }
      cy.get(`input[name="contacts[${index}].contact"]`).type(name);
      cy.get(`input[name="contacts[${index}].email"]`).type(email);
      cy.get(`input[name="contacts[${index}].phone"]`).type(phone);
    });
    cy.get('[data-cy=submit]').click();

    if (lease) {
      const { contract, beginDate, properties } = lease;
      cy.selectFieldText('leaseId', contract);
      // the end date derives from the lease duration; selecting the property
      // afterwards seeds its expense window with the contract dates
      cy.pickDate('beginDate', beginDate);
      properties.forEach(({ name, expense, entryDate, exitDate }, index) => {
        if (index > 0) {
          cy.get('[data-cy=addPropertiesItem]').click();
        }
        cy.selectFieldText(`properties[${index}]._id`, name);
        cy.get(`input[name="properties[${index}].expenses[0].title"]`).type(
          expense.title
        );
        cy.get(`input[name="properties[${index}].expenses[0].amount"]`).clear();
        cy.get(`input[name="properties[${index}].expenses[0].amount"]`).type(
          expense.amount
        );
        cy.pickDate(`properties[${index}].entryDate`, entryDate);
        cy.pickDate(`properties[${index}].exitDate`, exitDate);
      });
    }
    cy.get('[data-cy=submit]').click();

    if (billing) {
      const { isVat, percentageVatRatio } = billing;
      if (isVat) {
        cy.get('div:has(>input[name=isVat]) > button').click();
      }
      cy.get('input[name=vatRatio]').clear();
      cy.get('input[name=vatRatio]').type(percentageVatRatio);
    }
    cy.get('[data-cy=submit]').click();

    if (documents) {
      documents.forEach(({ type, ...template }) => {
        if (type === 'text') {
          const { templateName, title, content } = template;
          cy.get('[data-cy=addTenantTextDocument]').click();
          cy.get(
            `[data-cy=template-${templateName.replace(/\s/g, '')}]`
          ).click();
          if (title) {
            cy.get('input[name=title]').clear();
            cy.get('input[name=title]').type(title);
            cy.get('[data-cy="savingTextDocument"]').should('not.exist');
            cy.get('[data-cy="savedTextDocument"]').should('not.exist');
          }
          if (content) {
            cy.get('.ProseMirror').type(content);
            cy.get('[data-cy="savingTextDocument"]').should('not.exist');
            cy.get('[data-cy="savedTextDocument"]').should('not.exist');
          }
          cy.get('[data-cy=close]').click();
        } else if (type === 'file') {
          cy.get('[data-cy=addTenantFile]').click();
        }
      });
    }

    cy.get('[data-cy=submit]').click();
  }
);

Cypress.Commands.add('navAppMenu', (pageName) => {
  cy.get('[data-cy=appMenu]').click();
  cy.get(`[data-cy=${pageName}Nav]`).click();
  cy.checkPage(pageName);
});

Cypress.Commands.add('navOrgMenu', (pageName) => {
  cy.get('[data-cy=appMenu]').click();
  cy.get('[data-cy=settingsNav]').click();
  cy.get(`a[href$="/settings/${pageName}"]`).click();
  cy.checkPage(pageName);
});

// The app's select fields are radix comboboxes: a trigger button rendered
// next to a hidden native <select> that carries the field name and the
// value -> label mapping. Options open in a portaled [role=listbox] and only
// expose their label, so picking by value goes through the native select to
// resolve the label first.
const openSelectField = (name) =>
  cy
    .get(`select[name="${name}"]`)
    .parent()
    .find('button[role=combobox]')
    .click();

const exactText = (text) =>
  new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);

Cypress.Commands.add('selectField', (name, value) => {
  cy.get(`select[name="${name}"] option[value="${value}"]`)
    .invoke('text')
    .then((label) => {
      openSelectField(name);
      cy.contains('[role=listbox] [role=option]', exactText(label.trim())).click();
    });
});

Cypress.Commands.add('selectFieldText', (name, text) => {
  openSelectField(name);
  cy.contains('[role=listbox] [role=option]', text).click();
});

// Date fields are popover calendars without an input. Open the field through
// its label, step the calendar to the target month (the caption is localized,
// so it is parsed with the organization locale), then pick the day. Outside
// days belong to the neighbouring months and must not be matched.
Cypress.Commands.add('pickDate', (name, date, locale = 'fr') => {
  const target = moment(date, 'DD/MM/YYYY');

  cy.get(`label[for="${name}"]`).parent().find('button').click();

  const navigate = () => {
    cy.get('[role=dialog] div.text-sm.font-medium')
      .first()
      .invoke('text')
      .then((caption) => {
        const displayed = moment(caption.trim(), 'MMMM YYYY', locale);
        const diff = target
          .clone()
          .startOf('month')
          .diff(moment(displayed).startOf('month'), 'months');
        if (diff === 0) {
          cy.get('[role=dialog] button[name=day]:not(.day-outside)')
            .contains(new RegExp(`^${target.date()}$`))
            .click();
        } else {
          cy.get(
            `[role=dialog] button[name="${diff < 0 ? 'previous-month' : 'next-month'}"]`
          ).click();
          navigate();
        }
      });
  };
  navigate();
});

Cypress.Commands.add('checkUrl', (url) => {
  cy.url({ timeout: 8000 }).should('include', url);
});

Cypress.Commands.add('checkPage', (pageName) => {
  cy.get(`[data-cy=${pageName}Page]`).should('be.visible');
});

Cypress.Commands.add('searchResource', (text) => {
  cy.get('[data-cy=globalSearchField]').click();
  cy.get('[data-cy=globalSearchField]').clear();
  cy.get('[data-cy=globalSearchField]').type(text);
});

Cypress.Commands.add('openResource', (resourceName) => {
  cy.get('button[data-cy=openResourceButton]').contains(resourceName).click();
});

Cypress.Commands.add('removeResource', () => {
  cy.get('button[data-cy=removeResourceButton]').click();
  cy.get('[role=dialog]')
    .get('button')
    .contains(i18n.getFixedT('fr-FR')('Continue'))
    .click();
});
