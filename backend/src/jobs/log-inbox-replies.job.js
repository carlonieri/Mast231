require('dotenv').config();

const { readInbox } = require('../services/imap.service');
const { classifyReply } = require('../services/claude.service');
const { classifyIncomingMessageType, extractEmailAddresses } = require('../services/message-classifier');
const {
  findLeadByEmail,
  applyReplyClassification,
  removeLeadForOptOut,
} = require('../services/leads.service');
const { getPool } = require('../config/db');

// Rilevamento risposte + classificazione via Claude + routing.
// Vedi docs/mast231_gestionale_spec.md, requisiti funzionali #3, #4, #5.

async function alreadyLogged(messageId, leadId) {
  if (!messageId) return false;
  const result = await getPool().query(
    'SELECT 1 FROM email_events WHERE message_id = $1 AND lead_id = $2 LIMIT 1',
    [messageId, leadId]
  );
  return result.rowCount > 0;
}

// Per risposte umane e fuori-sede il mittente È il contatto tracciato.
// Per i bounce no: il mittente è il server di posta, quindi il lead va
// risalito tramite l'header X-Failed-Recipients (quando presente) o,
// altrimenti, scansionando il corpo del messaggio di mancato recapito alla
// ricerca di un indirizzo che corrisponda a un lead esistente.
async function findLeadForMessage(message, tipo) {
  if (tipo === 'bounce') {
    const failedHeader = message.headers['x-failed-recipients'];
    if (failedHeader) {
      const lead = await findLeadByEmail(failedHeader.trim().toLowerCase());
      if (lead) return lead;
    }
    for (const email of extractEmailAddresses(message.corpo)) {
      // eslint-disable-next-line no-await-in-loop
      const lead = await findLeadByEmail(email);
      if (lead) return lead;
    }
    return null;
  }

  const senderEmail = (message.mittenteArray || [])[0];
  return senderEmail ? findLeadByEmail(senderEmail) : null;
}

async function logInboxEvent({ leadId, message, categoria }) {
  await getPool().query(
    `INSERT INTO email_events (lead_id, direzione, data, oggetto, categoria, fonte, message_id)
     VALUES ($1, 'ricevuta', $2, $3, $4, 'inbox', $5)
     ON CONFLICT (message_id, lead_id) DO NOTHING`,
    [leadId, message.data, message.oggetto, categoria, message.messageId]
  );
}

async function processMessage(message) {
  const tipo = classifyIncomingMessageType(message);
  const lead = await findLeadForMessage(message, tipo);

  if (!lead) {
    return 'non_collegata'; // non è la risposta di un contatto tracciato
  }

  if (await alreadyLogged(message.messageId, lead.id)) {
    return 'gia_loggata';
  }

  if (tipo === 'bounce') {
    await logInboxEvent({ leadId: lead.id, message, categoria: 'bounce' });
    return 'bounce';
  }

  if (tipo === 'auto_reply') {
    await logInboxEvent({ leadId: lead.id, message, categoria: 'risposta_automatica_assenza' });
    return 'auto_reply';
  }

  // Risposta umana: classificazione via Claude + routing.
  const classificazione = await classifyReply({ oggetto: message.oggetto, corpo: message.corpo });

  if (classificazione === 'rimozione') {
    await removeLeadForOptOut({
      email: lead.email,
      motivo: 'Richiesta di rimozione ricevuta via risposta email',
    });
    return 'rimozione';
  }

  await logInboxEvent({ leadId: lead.id, message, categoria: classificazione });
  await applyReplyClassification({
    leadId: lead.id,
    classificazione,
    data: message.data,
    categoria: classificazione,
  });

  return classificazione;
}

async function runLogInboxRepliesJob({ limit = 50 } = {}) {
  const messages = await readInbox({ limit });
  const riepilogo = {};

  for (const message of messages) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const esito = await processMessage(message);
      riepilogo[esito] = (riepilogo[esito] || 0) + 1;
    } catch (err) {
      console.error(`Errore nel processare il messaggio "${message.oggetto}":`, err.message);
    }
  }

  console.log('Rilevamento risposte completato:', riepilogo);
  return riepilogo;
}

module.exports = { runLogInboxRepliesJob };

if (require.main === module) {
  runLogInboxRepliesJob()
    .then(() => getPool().end())
    .catch((err) => {
      console.error('Errore nel job di rilevamento risposte:', err);
      getPool()
        .end()
        .finally(() => process.exit(1));
    });
}
