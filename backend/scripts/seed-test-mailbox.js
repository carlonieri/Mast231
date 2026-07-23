// Script di sviluppo: crea una casella di posta di TEST usa-e-getta su Ethereal
// (https://ethereal.email, servizio pubblico per test, non consegna email reali)
// e la popola con qualche email finta in Posta Inviata e Posta in Arrivo, per
// verificare che la lettura IMAP funzioni senza toccare la casella vera del cliente.
//
// Uso: npm run imap:seed
// Poi copia le credenziali stampate in output dentro backend/.env e lancia:
// npm run imap:read

const nodemailer = require('nodemailer');
const { ImapFlow } = require('imapflow');
const { buildRawMessage, sentFixtures, inboxFixtures } = require('./fixtures/fake-messages');

const SENT_FOLDER = 'Posta Inviata';

async function main() {
  console.log('Creazione casella di test su Ethereal...');
  const account = await nodemailer.createTestAccount();

  const client = new ImapFlow({
    host: account.imap.host,
    port: account.imap.port,
    secure: account.imap.secure,
    auth: { user: account.user, pass: account.pass },
    logger: false,
  });

  await client.connect();

  try {
    await client.mailboxCreate(SENT_FOLDER);
  } catch (err) {
    console.log(`Nota: cartella "${SENT_FOLDER}" già presente o non creabile (${err.message})`);
  }

  for (const fixture of sentFixtures) {
    await client.append(
      SENT_FOLDER,
      buildRawMessage(fixture),
      ['\\Seen'],
      fixture.date
    );
  }

  for (const fixture of inboxFixtures) {
    await client.append(
      'INBOX',
      buildRawMessage(fixture),
      ['\\Seen'],
      fixture.date
    );
  }

  await client.logout();

  console.log('\nCasella di test popolata con successo.');
  console.log(`  ${sentFixtures.length} email finte in "${SENT_FOLDER}"`);
  console.log(`  ${inboxFixtures.length} email finte in "INBOX"`);
  console.log('\nCopia queste righe in backend/.env per usarla in locale:\n');
  console.log(`IMAP_HOST=${account.imap.host}`);
  console.log(`IMAP_PORT=${account.imap.port}`);
  console.log(`IMAP_TLS=${account.imap.secure}`);
  console.log(`IMAP_USER=${account.user}`);
  console.log(`IMAP_PASSWORD=${account.pass}`);
  console.log(`IMAP_INBOX_FOLDER=INBOX`);
  console.log(`IMAP_SENT_FOLDER=${SENT_FOLDER}`);
  console.log(`\nWebmail (solo per controllo visivo, non necessario): ${account.web}`);
}

main().catch((err) => {
  console.error('Errore durante il seeding della casella di test:', err);
  process.exit(1);
});
