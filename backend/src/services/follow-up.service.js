const { getPool } = require('../config/db');

// Crea un task da evadere per un operatore (tabella follow_up): usata sia per
// "lead interessato da contattare" sia per "nessuna risposta da N giorni —
// richiamare", che sono concettualmente lo stesso tipo di azione (cosa deve
// fare un operatore e quando), distinta solo dal testo in "motivo".
async function createFollowUp({ leadId, motivo, dataSuggerita }) {
  const result = await getPool().query(
    `INSERT INTO follow_up (lead_id, data_suggerita, motivo, stato)
     VALUES ($1, $2, $3, 'da_fare')
     RETURNING id`,
    [leadId, dataSuggerita, motivo]
  );
  return result.rows[0].id;
}

module.exports = { createFollowUp };
