import { jest } from '@jest/globals';

const createTransport = jest.fn(() => ({
  sendMail: jest.fn().mockResolvedValue({
    messageId: 'message-id',
    response: 'ok'
  })
}));

jest.unstable_mockModule('nodemailer', () => ({
  default: { createTransport }
}));

jest.unstable_mockModule('nodemailer-mailgun-transport', () => ({
  default: jest.fn()
}));

jest.unstable_mockModule('@bayle/common', () => ({
  Crypto: { decrypt: jest.fn((value) => `decrypted-${value}`) },
  Service: {
    getInstance: () => ({
      envConfig: { getValues: () => ({}) }
    })
  }
}));

const EmailEngine = await import('../emailengine.js');

const email = {
  from: 'from@example.com',
  replyTo: 'reply@example.com',
  to: 'tenant@example.com',
  subject: 'subject',
  text: 'text',
  html: '<p>html</p>',
  attachment: []
};

const landlordWithSmtp = (smtp) => ({
  landlord: { thirdParties: { smtp: { selected: true, ...smtp } } }
});

describe('sendEmail over SMTP', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // regression: the transport was built with `config.ports` (sic), so the
  // configured port was ignored and nodemailer fell back to its default
  it('honors the configured server and port (e.g. a local relay)', async () => {
    await EmailEngine.sendEmail(
      email,
      landlordWithSmtp({
        server: 'host.docker.internal',
        port: 1025,
        secure: false,
        authentication: false
      })
    );

    expect(createTransport).toHaveBeenCalledWith({
      host: 'host.docker.internal',
      port: 1025,
      secure: false,
      auth: undefined
    });
  });

  it('passes credentials only when authentication is enabled', async () => {
    await EmailEngine.sendEmail(
      email,
      landlordWithSmtp({
        server: 'smtp.example.com',
        port: 465,
        secure: true,
        authentication: true,
        username: 'user',
        password: 'encrypted'
      })
    );

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: { user: 'user', pass: 'decrypted-encrypted' }
    });
  });
});
