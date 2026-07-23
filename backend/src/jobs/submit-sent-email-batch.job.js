require('dotenv').config();
const crypto = require('crypto');

const { readSentItems } = require('../services/imap.service');
const { submitCategorizeSentEmailBatch } = require('../services/claude.service');
const { upsertLeadForSentEmail } = require('../services/leads.service');
const { getPool } = require('../config/db');

// Fase 1/2 (invio): legge Posta Inviata via IMAP e registra subito
// lead + email_events (categoria ancora NULL, "in attesa"), così i dati utili
// all'anti-duplicazione — data e destinatario dell'ultimo contatto — sono
// visibili da subito. La categorizzazione del contenuto non è urgente (a
// differenza della classificazione delle risposte, che resta in tempo
// reale): viene inoltrata alla Batch API di Claude, ~50% più economica di una
// chiamata diretta. Il risultato viene applicato più tardi da
// apply-sent-email-batch.job.js (fase 2/2), quando il batch è pronto — può
// richiedere fino a 24 ore, quindi questo job non attende, va solo rieseguito
// periodicamente come gli altri. Vedi docs/mast231_gestionale_spec.md,
// requisito funzionale #1 e checklist punto 3.

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

async function alreadySubmitted(messageId) {
  const result = await getPool().query('SELECT 1 FROM categorizzazioni_batch WHERE message_id = $1 LIMIT 1', [
    messageId,
  ]);
  return result.rowCount > 0;
}

async function logSentEmail(message) {
  const recipients = (message.destinatariArray || []).filter(Boolean);
  let processati = 0;
  let saltati = 0;

  for (const email of recipients) {
    // eslint-disable-next-line no-await-in-loop
    if (await alreadyLogged(message.messageId, email)) {
      saltati += 1;
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const leadId = await upsertLeadForSentEmail({ email, data: message.data, categoria: null });

    // eslint-disable-next-line no-await-in-loop
    await getPool().query(
      `INSERT INTO email_events (lead_id, direzione, data, oggetto, categoria, fonte, message_id)
       VALUES ($1, 'inviata', $2, $3, NULL, 'sent_items', $4)
       ON CONFLICT (message_id, lead_id) DO NOTHING`,
      [leadId, message.data, message.oggetto, message.messageId]
    );

    processati += 1;
  }

  return { processati, saltati };
}

async function runSubmitSentEmailBatchJob({ limit = 50 } = {}) {
  const messages = await readSentItems({ limit });

  let totaleProcessati = 0;
  let totaleSaltati = 0;
  const daInviare = [];

  for (const message of messages) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const { processati, saltati } = await logSentEmail(message);
      totaleProcessati += processati;
      totaleSaltati += saltati;

      // eslint-disable-next-line no-await-in-loop
      if (processati > 0 && !(await alreadySubmitted(message.messageId))) {
        daInviare.push({
          customId: crypto.randomUUID(),
          messageId: message.messageId,
          oggetto: message.oggetto,
          corpo: message.corpo,
        });
      }
    } catch (err) {
      console.error(`Errore nel processare il messaggio "${message.oggetto}":`, err.message);
    }
  }

  let batchId = null;
  if (daInviare.length > 0) {
    const batch = await submitCategorizeSentEmailBatch(daInviare);
    batchId = batch.id;

    for (const voce of daInviare) {
      // eslint-disable-next-line no-await-in-loop
      await getPool().query(
        `INSERT INTO categorizzazioni_batch (custom_id, batch_id, message_id) VALUES ($1, $2, $3)`,
        [voce.customId, batchId, voce.messageId]
      );
    }
  }

  console.log(
    `Log sent emails (invio batch): ${totaleProcessati} nuovi eventi, ${totaleSaltati} già presenti, ` +
      `${daInviare.length} messaggi inviati alla Batch API${batchId ? ` (batch ${batchId})` : ''}.`
  );
  return { totaleProcessati, totaleSaltati, inviatiAllaBatch: daInviare.length, batchId };
}

module.exports = { runSubmitSentEmailBatchJob };

if (require.main === module) {
  runSubmitSentEmailBatchJob()
    .then(() => getPool().end())
    .catch((err) => {
      console.error('Errore nel job di invio batch categorizzazione:', err);
      getPool()
        .end()
        .finally(() => process.exit(1));
    });
}
