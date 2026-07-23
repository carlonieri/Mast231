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

module.exports = { upsertLeadForSentEmail };
