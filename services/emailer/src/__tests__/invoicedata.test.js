import { jest } from '@jest/globals';

let dbTenant;

// Collections.Tenant.findOne(...).populate(...).populate(...) ... awaited
const tenantQuery = () => {
  const query = {
    populate: () => query,
    then: (resolve, reject) => Promise.resolve(dbTenant).then(resolve, reject)
  };
  return query;
};

jest.unstable_mockModule('@bayle/common', () => ({
  Collections: { Tenant: { findOne: () => tenantQuery() } }
}));

const Invoice = await import('../emailparts/data/invoice/index.js');

const makeDbTenant = (realm) => ({
  rents: [{ term: 2024030100 }],
  toObject: () => ({
    realmId: realm,
    leaseId: { timeRange: 'months' },
    contract: 'custom',
    beginDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    properties: [],
    rents: [{ term: 2024030100 }]
  })
});

describe('invoice email data - landlord name', () => {
  // regression: an individual landlord was named after their first contact
  // instead of the organization
  it('uses the organization name for an individual landlord', async () => {
    dbTenant = makeDbTenant({
      name: 'Our Organization',
      isCompany: false,
      companyInfo: { vatNumber: '' },
      contacts: [{ name: 'Jane Doe' }],
      addresses: [],
      members: []
    });

    const { landlord } = await Invoice.get('tenant-1', { term: '2024030100' });

    expect(landlord.name).toEqual('Our Organization');
  });

  it('uses the company name for a company landlord', async () => {
    dbTenant = makeDbTenant({
      name: 'Our Organization',
      isCompany: true,
      companyInfo: { name: 'ACME Corp', legalStructure: 'SARL' },
      contacts: [{ name: 'Jane Doe' }],
      addresses: [],
      members: []
    });

    const { landlord } = await Invoice.get('tenant-1', { term: '2024030100' });

    expect(landlord.name).toEqual('ACME Corp');
  });
});
