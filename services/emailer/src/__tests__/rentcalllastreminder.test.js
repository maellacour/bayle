import { fileURLToPath } from 'url';
import i18n from 'i18n';
import { jest } from '@jest/globals';
import path from 'path';

jest.unstable_mockModule('@bayle/common', () => ({
  Service: {
    getInstance: () => ({
      envConfig: { getValues: () => ({ APP_NAME: 'MicroRealEstate' }) }
    })
  }
}));

const EmailContent = await import('../emailcontent.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

i18n.configure({
  locales: ['en'],
  directory: path.join(__dirname, '..', 'locales'),
  updateFiles: false
});

// mirrors the shape produced by emailparts/data/invoice/index.js
const buildData = ({ isCompany, companyInfo }) => ({
  landlord: {
    name: isCompany ? companyInfo.name : 'Our Organization',
    isCompany,
    companyInfo,
    hasCompanyInfo: !!companyInfo,
    hasBankInfo: true,
    bankInfo: { name: 'The Bank', iban: 'XX00 0000 0000' },
    hasAddress: true,
    addresses: [{ street1: '1 Main St', zipCode: '12345', city: 'Town' }],
    hasContact: true,
    contacts: [
      { name: 'Jane Doe', email: 'jane@example.com', phone1: '0102030405' }
    ]
  },
  tenant: {
    name: 'John Tenant',
    street1: '2 Main St',
    zipCode: '12345',
    city: 'Town',
    contract: { beginDate: '01/01/2024', lease: { timeRange: 'months' } },
    rents: [{ total: { grandTotal: 500 } }]
  },
  period: 2024030100
});

const render = (data) =>
  EmailContent.build(
    'en',
    'EUR',
    'rentcall_last_reminder',
    'tenant-1',
    { term: 2024030100 },
    data
  );

describe('rentcall_last_reminder content', () => {
  // regression: the legal structure prefix was gated on the mere presence of
  // a companyInfo object (which the billing form creates for individuals
  // too), rendering "undefined Jane Doe" for non-company landlords
  it('does not prepend a legal structure for an individual landlord', async () => {
    const { html, text } = await render(
      buildData({ isCompany: false, companyInfo: { vatNumber: '' } })
    );

    expect(html).not.toContain('undefined');
    expect(text).not.toContain('undefined');
    expect(html).toContain('Our Organization');
    expect(text).toContain('Our Organization');
  });

  it('prefixes the legal structure for a company landlord', async () => {
    const { html, text } = await render(
      buildData({
        isCompany: true,
        companyInfo: { name: 'ACME Corp', legalStructure: 'SARL' }
      })
    );

    expect(html).toContain('SARL ACME Corp');
    expect(text).toContain('SARL ACME Corp');
  });

  it('omits the legal structure when a company has not set one', async () => {
    const { html, text } = await render(
      buildData({ isCompany: true, companyInfo: { name: 'ACME Corp' } })
    );

    expect(html).not.toContain('undefined');
    expect(text).not.toContain('undefined');
    expect(html).toContain('ACME Corp');
  });
});
