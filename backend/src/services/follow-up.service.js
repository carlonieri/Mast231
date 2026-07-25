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

// Lista dei richiami, con i dati del lead collegato. `soloOggi` filtra a
// scadenza oggi o già scaduta (data_suggerita <= oggi) — usato per
// l'indicatore "richiami del giorno" nell'interfaccia.
async function listFollowUp({ stato = 'da_fare', soloOggi = false } = {}) {
  const condizioni = ['f.stato = $1'];
  const parametri = [stato];

  if (soloOggi) {
    condizioni.push('f.data_suggerita <= CURRENT_DATE');
  }

  const result = await getPool().query(
    `SELECT f.id, f.lead_id, f.data_suggerita, f.motivo, f.stato, f.created_at,
            l.email, l.nome, l.citta, l.regione
     FROM follow_up f
     JOIN leads l ON l.id = f.lead_id
     WHERE ${condizioni.join(' AND ')}
     ORDER BY f.data_suggerita ASC NULLS LAST, f.created_at ASC`,
    parametri
  );
  return result.rows;
}

// Segna un richiamo come evaso (l'invio resta comunque manuale via Outlook:
// questo aggiorna solo lo stato del task nel gestionale).
async function markFollowUpDone(id) {
  const result = await getPool().query(
    `UPDATE follow_up SET stato = 'fatto', updated_at = now() WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
}

module.exports = { createFollowUp, listFollowUp, markFollowUpDone };
