require('dotenv').config();

const { readSentItems } = require('../services/imap.service');
const { categorizeSentEmail } = require('../services/claude.service');
const { upsertLeadForSentEmail } = require('../services/leads.service');
const { getPool } = require('../config/db');

// Log automatico delle email inviate + categorizzazione via Claude.
// Vedi docs/mast231_gestionale_spec.md, requisito funzionale #1 e checklist punto 3.

async function alreadyLogged(messageId, email) {
  if (!messageId) return false;
  const result = await getPool().query(
    `SELECT 1 FROM email_events ee
     JOIN leads l ON l.id = ee.lead_id
     WHERE ee.message_id = $1 AND l.email = $2
     LIMIT 1`,
    [messageId, email]
  );
  return result.rowCount > 0;
}

async function logSentEmail(message) {
  const recipients = (message.destinatariArray || []).filter(Boolean);
  let processati = 0;
  let saltati = 0;
  let categoria = null;

  for (const email of recipients) {
    // eslint-disable-next-line no-await-in-loop
    if (await alreadyLogged(message.messageId, email)) {
      saltati += 1;
      continue;
    }

    if (categoria === null) {
      // Categorizza una sola volta per messaggio, anche con più destinatari.
      // eslint-disable-next-line no-await-in-loop
      categoria = await categorizeSentEmail({ oggetto: message.oggetto, corpo: message.corpo });
    }

    // eslint-disable-next-line no-await-in-loop
    const leadId = await upsertLeadForSentEmail({ email, data: message.data, categoria });

    // eslint-disable-next-line no-await-in-loop
    await getPool().query(
      `INSERT INTO email_events (lead_id, direzione, data, oggetto, categoria, fonte, message_id)
       VALUES ($1, 'inviata', $2, $3, $4, 'sent_items', $5)
       ON CONFLICT (message_id, lead_id) DO NOTHING`,
      [leadId, message.data, message.oggetto, categoria, message.messageId]
    );

    processati += 1;
  }

  return { processati, saltati };
}

async function runLogSentEmailsJob({ limit = 50 } = {}) {
  const messages = await readSentItems({ limit });
  let totaleProcessati = 0;
  let totaleSaltati = 0;

  for (const message of messages) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const { processati, saltati } = await logSentEmail(message);
      totaleProcessati += processati;
      totaleSaltati += saltati;
    } catch (err) {
      console.error(`Errore nel processare il messaggio "${message.oggetto}":`, err.message);
    }
  }

  console.log(`Log sent emails: ${totaleProcessati} nuovi eventi, ${totaleSaltati} già presenti.`);
  return { totaleProcessati, totaleSaltati };
}

module.exports = { runLogSentEmailsJob };

if (require.main === module) {
  runLogSentEmailsJob()
    .then(() => getPool().end())
    .catch((err) => {
      console.error('Errore nel job di log email inviate:', err);
      getPool()
        .end()
        .finally(() => process.exit(1));
    });
}
