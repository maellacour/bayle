import ejs from 'ejs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.join(__dirname, '..', '..', 'templates');

// minimal stand-in for utils/templatefunctions.js: identity + interpolation
const _ = {
  t: (text, params) =>
    text.replace(/\{\{(\w+)\}\}/g, (match, key) => params?.[key] ?? match)
};

const render = (template, data) =>
  ejs.renderFile(path.join(templatesDir, template), data, {
    root: templatesDir
  });

describe('pdf header', () => {
  // regression: the contact loop used for...in, iterating indexes instead of
  // contacts, so no phone or email ever rendered
  it('lists the landlord contact phones and email', async () => {
    const html = await render('partials/header.ejs', {
      logoUrl: 'logo.png',
      landlord: {
        name: 'Our Organization',
        hasAddress: false,
        contacts: [
          {
            name: 'Jane Doe',
            email: 'jane@example.com',
            phone1: '0102030405',
            phone2: '0607080910'
          }
        ]
      },
      _
    });

    expect(html).toContain('0102030405');
    expect(html).toContain('0607080910');
    expect(html).toContain('jane@example.com');
  });
});

describe('pdf owner/manager signature', () => {
  // regression: the template read the misspelled `legalRespresentative`, so
  // the company legal representative never rendered
  it('renders the legal representative of a company landlord', async () => {
    const html = await render('partials/ownermanagersignature.ejs', {
      landlord: {
        isCompany: true,
        name: 'ACME Corp',
        companyInfo: { legalRepresentative: 'John Smith' }
      }
    });

    expect(html).toContain('John Smith');
    expect(html).not.toContain('undefined');
  });

  it('renders the landlord name for an individual landlord', async () => {
    const html = await render('partials/ownermanagersignature.ejs', {
      landlord: { isCompany: false, name: 'Our Organization' }
    });

    expect(html).toContain('Our Organization');
  });
});
