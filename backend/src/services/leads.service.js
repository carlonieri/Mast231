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

module.exports = {
  upsertLeadForSentEmail,
  findLeadByEmail,
  applyReplyClassification,
  removeLeadForOptOut,
};
