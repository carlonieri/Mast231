// Riconoscimento di bounce (mancato recapito) e risposte automatiche di
// assenza (fuori sede): non sono vere risposte del contatto e non vanno
// classificate come interessato/non interessato/rimozione/ambiguo, altrimenti
// falserebbero sia il routing dei lead sia le statistiche di tasso di risposta.

const BOUNCE_SENDER_PATTERN = /mailer-daemon|postmaster|mail delivery/i;
const BOUNCE_SUBJECT_PATTERN =
  /undeliver|delivery (status notification|failed|failure)|returned to sender|non\s+recapitat|recapito non riuscito|indirizzo (email )?non valido|failure notice|mail delivery failed/i;
const BOUNCE_CONTENT_TYPE_PATTERN = /report-type\s*=\s*delivery-status/i;

const AUTOREPLY_SUBJECT_PATTERN =
  /out of office|automatic reply|auto-?reply|risposta automatica|fuori sede|fuori ufficio|assente dall|in ferie|vacation/i;

function isBounce({ mittente, oggetto, headers = {} }) {
  return (
    BOUNCE_SENDER_PATTERN.test(mittente || '') ||
    BOUNCE_SUBJECT_PATTERN.test(oggetto || '') ||
    BOUNCE_CONTENT_TYPE_PATTERN.test(headers['content-type'] || '') ||
    Boolean(headers['x-failed-recipients'])
  );
}

function isAutoReply({ oggetto, headers = {} }) {
  const autoSubmitted = (headers['auto-submitted'] || '').toLowerCase();
  const precedence = (headers['precedence'] || '').toLowerCase();
  return (
    autoSubmitted === 'auto-replied' ||
    Boolean(headers['x-autoreply']) ||
    Boolean(headers['x-autorespond']) ||
    precedence === 'auto_reply' ||
    AUTOREPLY_SUBJECT_PATTERN.test(oggetto || '')
  );
}

// Bounce controllato prima: un errore di consegna ha priorità su eventuali
// pattern testuali ambigui nell'oggetto.
function classifyIncomingMessageType(message) {
  if (isBounce(message)) return 'bounce';
  if (isAutoReply(message)) return 'auto_reply';
  return 'umano';
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function extractEmailAddresses(text) {
  if (!text) return [];
  return [...new Set((text.match(EMAIL_REGEX) || []).map((e) => e.toLowerCase()))];
}

module.exports = { classifyIncomingMessageType, isBounce, isAutoReply, extractEmailAddresses };
