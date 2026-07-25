require('dotenv').config();

const { getPool } = require('../config/db');
const { createFollowUp } = require('../services/follow-up.service');

// Passaggio a "senza risposta" per chi non ha risposto entro N giorni
// configurabili, con data di richiamo suggerita. Job separato e indipendente
// dalla classificazione delle risposte (va eseguito periodicamente, es. una
// volta al giorno) — vedi docs/mast231_gestionale_spec.md, requisito
// funzionale #5 (terzo punto) e checklist punto 6.
//
// Il sistema pianifica, non invia: il richiamo resta un'azione manuale.

const DEFAULT_SOGLIA_GIORNI = 7;

async function runFlagNoResponseLeadsJob({ soglia } = {}) {
  const soglianGiorni = soglia ?? (Number(process.env.FOLLOWUP_DAYS_THRESHOLD) || DEFAULT_SOGLIA_GIORNI);

  // Solo i lead "contattato" (in attesa di risposta) la cui ultima email
  // risale a più della soglia: chi è già interessato/non_interessato/escluso
  // o già segnato senza_risposta non viene toccato di nuovo.
  const result = await getPool().query(
    `SELECT id, email
     FROM leads
     WHERE stato = 'contattato'
       AND ultima_data_contatto IS NOT NULL
       AND ultima_data_contatto <= now() - ($1::text || ' days')::interval`,
    [soglianGiorni]
  );

  let aggiornati = 0;
  for (const lead of result.rows) {
    // eslint-disable-next-line no-await-in-loop
    await getPool().query(`UPDATE leads SET stato = 'senza_risposta', updated_at = now() WHERE id = $1`, [
      lead.id,
    ]);
    // eslint-disable-next-line no-await-in-loop
    await createFollowUp({
      leadId: lead.id,
      motivo: `Nessuna risposta da oltre ${soglianGiorni} giorni — richiamare`,
      dataSuggerita: new Date(),
    });
    aggiornati += 1;
  }

  console.log(`Lead spostati in "senza_risposta": ${aggiornati} (soglia: ${soglianGiorni} giorni).`);
  return { aggiornati, soglianGiorni };
}

module.exports = { runFlagNoResponseLeadsJob };

if (require.main === module) {
  runFlagNoResponseLeadsJob()
    .then(() => getPool().end())
    .catch((err) => {
      console.error('Errore nel job di rilevamento lead senza risposta:', err);
      getPool()
        .end()
        .finally(() => process.exit(1));
    });
}
