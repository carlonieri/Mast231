const { ImapFlow } = require('imapflow');
const { getImapConfig, FOLDERS } = require('../config/imap');

// Unica funzione di SCRITTURA verso la casella email in tutto il progetto, ed
// eccezione esplicita al principio "sola lettura" degli altri servizi IMAP
// (vedi imap.service.js): genera bozze reali nella cartella Bozze con i
// destinatari già inseriti. Oggetto e corpo restano vuoti — il sistema non
// scrive mai il testo dell'email, quello resta sempre dell'operatore. Nessun
// invio: solo IMAP APPEND in Bozze, mai SMTP.
// Vedi docs/mast231_gestionale_spec.md, sezione "Vincoli duri".

function buildDraftMessage({ to, bcc, from, date }) {
  const headers = [];
  if (to) headers.push(`To: ${to}`);
  if (bcc) headers.push(`Bcc: ${bcc}`);
  if (from) headers.push(`From: ${from}`);
  headers.push(
    `Date: ${date.toUTCString()}`,
    `Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@mast231.local>`,
    'Content-Type: text/plain; charset=utf-8'
  );
  return [...headers, '', ''].join('\r\n');
}

// batches: array di array di { email }. Genera una bozza per ciascun batch.
// campo: 'to' (default, "Carica lista giornaliera": destinatari in chiaro,
// stessa email a tutti i nuovi contatti del giorno) oppure 'bcc' (richiamo
// "senza risposta" per zona: destinatari in CCN, non devono vedersi tra loro
// — il campo "A" viene valorizzato con la casella stessa, per non lasciarlo
// vuoto).
async function generateDraftsForBatches(batches, { campo = 'to' } = {}) {
  if (!batches || batches.length === 0) return [];

  const client = new ImapFlow(getImapConfig());
  await client.connect();

  const risultati = [];
  try {
    try {
      await client.mailboxCreate(FOLDERS.drafts);
    } catch (err) {
      // cartella già esistente o non creabile: si prosegue comunque
    }

    for (let i = 0; i < batches.length; i += 1) {
      const destinatari = batches[i].map((riga) => riga.email);
      const raw = buildDraftMessage(
        campo === 'bcc'
          ? { to: process.env.IMAP_USER, bcc: destinatari.join(', '), from: process.env.IMAP_USER, date: new Date() }
          : { to: destinatari.join(', '), from: process.env.IMAP_USER, date: new Date() }
      );
      // eslint-disable-next-line no-await-in-loop
      const esito = await client.append(FOLDERS.drafts, raw, ['\\Draft'], new Date());
      risultati.push({ numeroBatch: i + 1, destinatari, uid: esito.uid });
    }
  } finally {
    await client.logout();
  }

  return risultati;
}

module.exports = { generateDraftsForBatches };
