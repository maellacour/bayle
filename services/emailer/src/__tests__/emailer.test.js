import { jest } from '@jest/globals';

let savedEmails;
let failSaves;
let sendEmailMock;

jest.unstable_mockModule('@bayle/common', () => ({
  Collections: {
    Email: class Email {
      constructor(doc) {
        this.doc = doc;
      }
      save() {
        if (failSaves) {
          return Promise.reject(new Error('db down'));
        }
        savedEmails.push(this.doc);
        return Promise.resolve(this.doc);
      }
    }
  },
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  },
  Service: {
    getInstance: () => ({
      envConfig: { getValues: () => ({ ALLOW_SENDING_EMAILS: true }) }
    })
  },
  ServiceError: class ServiceError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }
}));

jest.unstable_mockModule('../emaildata.js', () => ({
  build: async () => ({ landlord: {}, tenant: {} })
}));
jest.unstable_mockModule('../emailrecipients.js', () => ({
  build: async () => [{ to: 'tenant@example.com', bcc: 'landlord@example.com' }]
}));
jest.unstable_mockModule('../emailattachments.js', () => ({
  build: async () => ({ attachment: [] })
}));
jest.unstable_mockModule('../emailcontent.js', () => ({
  build: async () => ({ subject: 'subject', text: 'text', html: '<p></p>' })
}));
jest.unstable_mockModule('../emailengine.js', () => ({
  sendEmail: (...args) => sendEmailMock(...args)
}));

const Emailer = await import('../emailer.js');

const send = () =>
  Emailer.send('Bearer token', 'en', 'EUR', 'realm-1', 'rentcall', 'tenant-1', {
    term: 2024030100
  });

describe('send email log', () => {
  beforeEach(() => {
    savedEmails = [];
    failSaves = false;
    sendEmailMock = jest
      .fn()
      .mockResolvedValue({ id: 'provider-id', message: 'ok' });
    jest.clearAllMocks();
  });

  it('records a sent email with its realm, recipients and status', async () => {
    const results = await send();

    expect(savedEmails).toHaveLength(1);
    expect(savedEmails[0]).toMatchObject({
      realmId: 'realm-1',
      templateName: 'rentcall',
      recordId: 'tenant-1',
      params: { term: 2024030100 },
      sentTo: 'tenant@example.com',
      sentBcc: 'landlord@example.com',
      status: 'sent',
      emailId: 'provider-id'
    });
    expect(results).toHaveLength(1);
    expect(results[0].email).toEqual('tenant@example.com');
  });

  // regression: a failed send left no trace at all in the email log
  it('records a failed email with the error and rethrows', async () => {
    sendEmailMock = jest.fn().mockRejectedValue(new Error('smtp down'));

    await expect(send()).rejects.toThrow('smtp down');

    expect(savedEmails).toHaveLength(1);
    expect(savedEmails[0]).toMatchObject({
      realmId: 'realm-1',
      sentTo: 'tenant@example.com',
      status: 'failed'
    });
    expect(savedEmails[0].errorMessage).toContain('smtp down');
  });

  it('still reports a sent email when the log cannot be written', async () => {
    failSaves = true;

    const results = await send();

    expect(results).toHaveLength(1);
    expect(savedEmails).toHaveLength(0);
  });
});
