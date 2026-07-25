const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const { getImapConfig, FOLDERS } = require('../config/imap');

// Collegamento IMAP in sola lettura. Questo modulo espone SOLO funzioni di lettura
// (readOnly: true su ogni mailbox aperta) e non importa né richiede alcuna libreria
// SMTP: il vincolo "mai inviare email in autonomia" è quindi strutturale, non solo
// applicativo — vedi docs/mast231_gestionale_spec.md, sezione "Vincoli duri".

// Converte la Map di header di mailparser in un oggetto piano (chiavi già
// minuscole). Gli header strutturati (from/to/date, già letti dall'envelope)
// vengono ignorati; servono solo gli header scalari usati per riconoscere
// bounce e risposte automatiche (content-type, auto-submitted, ecc.).
function headersMapToObject(headersMap) {
  const obj = {};
  for (const [key, value] of headersMap) {
    if (typeof value === 'string') {
      obj[key] = value;
    } else if (Array.isArray(value)) {
      obj[key] = value.filter((v) => typeof v === 'string').join(', ');
    }
  }
  return obj;
}

async function withClient(fn) {
  const client = new ImapFlow(getImapConfig());
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.logout();
  }
}

async function readFolder(folderPath, { limit = 50 } = {}) {
  return withClient(async (client) => {
    const lock = await client.getMailboxLock(folderPath, { readOnly: true });
    try {
      const total = client.mailbox.exists;
      if (total === 0) return [];

      const start = Math.max(1, total - limit + 1);
      const messages = [];

      for await (const msg of client.fetch(`${start}:*`, { envelope: true, source: true })) {
        const parsed = await simpleParser(msg.source);
        const destinatariArray = (msg.envelope.to || []).map((a) => a.address).filter(Boolean);
        const mittenteArray = (msg.envelope.from || []).map((a) => a.address).filter(Boolean);
        messages.push({
          uid: msg.uid,
          messageId: parsed.messageId || null,
          data: msg.envelope.date,
          oggetto: msg.envelope.subject,
          mittente: mittenteArray.join(', '),
          mittenteArray,
          destinatari: destinatariArray.join(', '),
          destinatariArray,
          corpo: parsed.text ? parsed.text.trim() : '',
          headers: headersMapToObject(parsed.headers),
        });
      }

      return messages;
    } finally {
      lock.release();
    }
  });
}

function readInbox(options) {
  return readFolder(FOLDERS.inbox, options);
}

function readSentItems(options) {
  return readFolder(FOLDERS.sent, options);
}

module.exports = { readFolder, readInbox, readSentItems };
