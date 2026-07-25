const { getPool } = require('../config/db');

// Crea il lead se non esiste (email non ancora vista), altrimenti aggiorna la
// categoria/data dell'ultimo contatto. Lo stato passa a 'contattato' solo se
// era 'da_contattare': non sovrascrive stati già assegnati da una risposta
// (interessato/non_interessato/senza_risposta/escluso).
async function upsertLeadForSentEmail({ email, data, categoria }) {
  const result = await getPool().query(
    `INSERT INTO leads (email, stato, ultima_categoria_email, ultima_data_contatto)
     VALUES ($1, 'contattato', $2, $3)
     ON CONFLICT (email) DO UPDATE SET
       stato = CASE WHEN leads.stato = 'da_contattare' THEN 'contattato' ELSE leads.stato END,
       ultima_categoria_email = EXCLUDED.ultima_categoria_email,
       ultima_data_contatto = EXCLUDED.ultima_data_contatto,
       updated_at = now()
     RETURNING id`,
    [email, categoria, data]
  );
  return result.rows[0].id;
}

async function findLeadByEmail(email) {
  const result = await getPool().query('SELECT id, email, stato FROM leads WHERE email = $1', [email]);
  return result.rows[0] || null;
}

// Applica l'esito della classificazione di una risposta umana (interessato /
// non_interessato / ambiguo — "rimozione" è gestita a parte da
// removeLeadForOptOut). Per "ambiguo" lo stato non cambia: non è un segnale
// chiaro né in un senso né nell'altro, resta da valutare a mano.
async function applyReplyClassification({ leadId, classificazione, data, categoria }) {
  const nuovoStato =
    classificazione === 'interessato'
      ? 'interessato'
      : classificazione === 'non_interessato'
        ? 'non_interessato'
        : null;

  await getPool().query(
    `UPDATE leads
     SET stato = COALESCE($1, stato),
         ultima_categoria_email = $2,
         ultima_data_contatto = $3,
         updated_at = now()
     WHERE id = $4`,
    [nuovoStato, categoria, data, leadId]
  );
}

// Applica la categoria risolta in modo asincrono (via Batch API, vedi
// submit/apply-sent-email-batch.job.js) a tutti i lead di un messaggio
// inviato — ma solo se quel messaggio è ancora il loro contatto più recente:
// un risultato di batch arrivato in ritardo (fino a 24 ore) non deve mai
// sovrascrivere una categorizzazione più recente (es. un nuovo invio nel
// frattempo).
async function applyCategoriaForMessage({ messageId, categoria }) {
  await getPool().query(
    `UPDATE leads
     SET ultima_categoria_email = $1, updated_at = now()
     FROM email_events
     WHERE email_events.message_id = $2
       AND email_events.lead_id = leads.id
       AND leads.ultima_data_contatto <= email_events.data`,
    [categoria, messageId]
  );
}

// Unica azione che il sistema può eseguire in autonomia (vedi spec, sezione
// "Vincoli duri"): su richiesta di rimozione, registra l'esclusione (blocca
// anche un futuro ricaricamento dello stesso indirizzo come lead) e cancella
// i dati del contatto. Transazionale: o avvengono entrambe le scritture, o nessuna.
async function removeLeadForOptOut({ email, motivo }) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO esclusioni (email, motivo) VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING`,
      [email, motivo]
    );
    await client.query('DELETE FROM leads WHERE email = $1', [email]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Lista lead filtrabile per stato (uno o più, per raggruppare più stato in
// un'unica sezione del gestionale — es. "in acquisizione" = da_contattare +
// contattato), città e regione. Vedi spec, requisiti funzionali #6 e #7.
async function listLeads({ stati, citta, regione } = {}) {
  const condizioni = [];
  const parametri = [];

  if (stati && stati.length > 0) {
    const placeholders = stati.map((_, i) => `$${parametri.length + i + 1}`).join(', ');
    condizioni.push(`stato IN (${placeholders})`);
    parametri.push(...stati);
  }
  if (citta) {
    parametri.push(citta);
    condizioni.push(`citta = $${parametri.length}`);
  }
  if (regione) {
    parametri.push(regione);
    condizioni.push(`regione = $${parametri.length}`);
  }

  const whereClause = condizioni.length > 0 ? `WHERE ${condizioni.join(' AND ')}` : '';
  const result = await getPool().query(
    `SELECT id, email, nome, citta, regione, stato, ultima_categoria_email, ultima_data_contatto, created_at
     FROM leads
     ${whereClause}
     ORDER BY ultima_data_contatto DESC NULLS LAST, created_at DESC`,
    parametri
  );
  return result.rows;
}

// Città/regione distinte tra i lead esistenti, per popolare i filtri —
// indipendenti dai filtri correnti, così le opzioni non si restringono da sole.
async function getFilterOptions() {
  const result = await getPool().query(
    `SELECT DISTINCT citta, regione FROM leads WHERE citta IS NOT NULL OR regione IS NOT NULL`
  );
  const citta = [...new Set(result.rows.map((r) => r.citta).filter(Boolean))].sort();
  const regione = [...new Set(result.rows.map((r) => r.regione).filter(Boolean))].sort();
  return { citta, regione };
}

// Dettaglio contatto: lead + storico email completo (email_events) + richiami
// collegati (follow_up). Vedi spec, requisito funzionale #2 (avviso
// anti-duplicazione: ultima_categoria_email/ultima_data_contatto sul lead) e
// checklist punto 7 ("vista dettaglio contatto con storico email").
async function getLeadDetail(id) {
  const leadResult = await getPool().query('SELECT * FROM leads WHERE id = $1', [id]);
  const lead = leadResult.rows[0];
  if (!lead) return null;

  const storicoResult = await getPool().query(
    `SELECT id, direzione, data, oggetto, categoria, fonte, created_at
     FROM email_events WHERE lead_id = $1 ORDER BY data DESC`,
    [id]
  );
  const richiamiResult = await getPool().query(
    `SELECT id, data_suggerita, motivo, stato, created_at
     FROM follow_up WHERE lead_id = $1 ORDER BY data_suggerita DESC NULLS LAST, created_at DESC`,
    [id]
  );

  return { ...lead, storico: storicoResult.rows, richiami: richiamiResult.rows };
}

const STATI_VALIDI = [
  'da_contattare',
  'contattato',
  'interessato',
  'non_interessato',
  'senza_risposta',
  'escluso',
  'acquisito',
];

// Aggiornamento manuale dello stato da parte di un operatore (es. segnare un
// lead come "acquisito" — nessun segnale email lo indica automaticamente).
async function updateLeadStato(id, stato) {
  if (!STATI_VALIDI.includes(stato)) {
    const err = new Error(`Stato non valido: ${stato}`);
    err.statusCode = 400;
    throw err;
  }
  const result = await getPool().query(
    `UPDATE leads SET stato = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [stato, id]
  );
  return result.rows[0] || null;
}

module.exports = {
  upsertLeadForSentEmail,
  findLeadByEmail,
  applyReplyClassification,
  applyCategoriaForMessage,
  removeLeadForOptOut,
  listLeads,
  getFilterOptions,
  getLeadDetail,
  updateLeadStato,
  STATI_VALIDI,
};
