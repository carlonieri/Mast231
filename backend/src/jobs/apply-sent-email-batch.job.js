require('dotenv').config();

const { retrieveBatchStatus, retrieveBatchResults, parseCategorizeSentEmailResult } = require('../services/claude.service');
const { applyCategoriaForMessage } = require('../services/leads.service');
const { getPool } = require('../config/db');

// Fase 2/2 (applicazione): controlla i batch di categorizzazione email
// inviate ancora "in attesa" e, quando Claude li ha completati, applica la
// categoria risolta a email_events e ai lead collegati. Non attende in
// blocco: i batch possono richiedere fino a 24 ore, quindi va rieseguito
// periodicamente (come submit-sent-email-batch.job.js, la prima metà di
// questa pipeline). Vedi docs/mast231_gestionale_spec.md, requisito
// funzionale #1.

async function segnaCompletato(id) {
  await getPool().query(`UPDATE categorizzazioni_batch SET stato = 'completato', completato_il = now() WHERE id = $1`, [
    id,
  ]);
}

async function segnaErrore(id) {
  await getPool().query(`UPDATE categorizzazioni_batch SET stato = 'errore', completato_il = now() WHERE id = $1`, [
    id,
  ]);
}

async function applicaRisultatiBatch(batchId, vociInAttesa) {
  const vociPerCustomId = new Map(vociInAttesa.map((v) => [v.custom_id, v]));
  const risultati = await retrieveBatchResults(batchId);

  let applicati = 0;
  let errori = 0;

  for (const risultato of risultati) {
    const voce = vociPerCustomId.get(risultato.custom_id);
    if (!voce) continue; // custom_id non tracciato in questo run: ignorato

    if (risultato.result.type === 'succeeded') {
      try {
        const categoria = parseCategorizeSentEmailResult(risultato.result.message);
        // eslint-disable-next-line no-await-in-loop
        await getPool().query(`UPDATE email_events SET categoria = $1 WHERE message_id = $2`, [
          categoria,
          voce.message_id,
        ]);
        // eslint-disable-next-line no-await-in-loop
        await applyCategoriaForMessage({ messageId: voce.message_id, categoria });
        // eslint-disable-next-line no-await-in-loop
        await segnaCompletato(voce.id);
        applicati += 1;
      } catch (err) {
        console.error(`Errore nell'applicare il risultato per il messaggio ${voce.message_id}:`, err.message);
        // eslint-disable-next-line no-await-in-loop
        await segnaErrore(voce.id);
        errori += 1;
      }
    } else {
      console.error(
        `Batch: richiesta ${risultato.custom_id} non riuscita (${risultato.result.type}) per il messaggio ${voce.message_id}`
      );
      // eslint-disable-next-line no-await-in-loop
      await segnaErrore(voce.id);
      errori += 1;
    }
  }

  return { applicati, errori };
}

async function runApplySentEmailBatchJob() {
  const batchInAttesa = await getPool().query(
    `SELECT DISTINCT batch_id FROM categorizzazioni_batch WHERE stato = 'in_attesa'`
  );

  let totaleApplicati = 0;
  let totaleErrori = 0;
  let batchAncoraInCorso = 0;

  for (const riga of batchInAttesa.rows) {
    const batchId = riga.batch_id;
    try {
      // eslint-disable-next-line no-await-in-loop
      const stato = await retrieveBatchStatus(batchId);
      if (stato.processing_status !== 'ended') {
        batchAncoraInCorso += 1;
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const vociInAttesa = (
        await getPool().query(
          `SELECT id, custom_id, message_id FROM categorizzazioni_batch WHERE batch_id = $1 AND stato = 'in_attesa'`,
          [batchId]
        )
      ).rows;

      // eslint-disable-next-line no-await-in-loop
      const { applicati, errori } = await applicaRisultatiBatch(batchId, vociInAttesa);
      totaleApplicati += applicati;
      totaleErrori += errori;
    } catch (err) {
      console.error(`Errore nel controllare il batch ${batchId}:`, err.message);
    }
  }

  console.log(
    `Applicazione risultati batch: ${totaleApplicati} categorie applicate, ${totaleErrori} errori, ` +
      `${batchAncoraInCorso} batch ancora in corso.`
  );
  return { totaleApplicati, totaleErrori, batchAncoraInCorso };
}

module.exports = { runApplySentEmailBatchJob };

if (require.main === module) {
  runApplySentEmailBatchJob()
    .then(() => getPool().end())
    .catch((err) => {
      console.error('Errore nel job di applicazione risultati batch:', err);
      getPool()
        .end()
        .finally(() => process.exit(1));
    });
}
