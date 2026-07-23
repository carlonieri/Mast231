// Script di sviluppo: legge Posta Inviata e Posta in Arrivo usando le credenziali
// IMAP configurate in backend/.env (tipicamente quelle stampate da `npm run imap:seed`)
// e stampa i risultati, per verificare che il collegamento in lettura funzioni.
//
// Uso: npm run imap:read

require('dotenv').config();
const { readInbox, readSentItems } = require('../src/services/imap.service');

function printMessages(label, messages) {
  console.log(`\n${label} (${messages.length} messaggi)`);
  for (const msg of messages) {
    console.log(`- [${msg.data?.toISOString?.() ?? msg.data}] ${msg.mittente} → ${msg.destinatari}: "${msg.oggetto}"`);
  }
}

async function main() {
  if (!process.env.IMAP_HOST || !process.env.IMAP_USER) {
    console.error('IMAP_HOST / IMAP_USER non configurati in backend/.env. Esegui prima "npm run imap:seed".');
    process.exit(1);
  }

  const [sent, inbox] = await Promise.all([readSentItems(), readInbox()]);

  printMessages('Posta Inviata', sent);
  printMessages('Posta in Arrivo', inbox);
}

main().catch((err) => {
  console.error('Errore durante la lettura della casella:', err);
  process.exit(1);
});
