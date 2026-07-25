const { getPool } = require('../config/db');
const { generateDraftsForBatches } = require('./imap-draft.service');
const { chunk } = require('../utils/chunk');

const DEFAULT_BATCH_SIZE = 150;

// Requisito funzionale #8: velocizzare il richiamo di "chi non ha risposto"
// per città/regione. Non un export CSV/vCard separato (l'idea originale
// legata a Microsoft Graph, non disponibile su Aruba/IMAP): riusa lo stesso
// meccanismo già collegato a "Carica lista giornaliera" — genera una bozza
// reale in Bozze con i contatti "senza risposta" della zona in CCN (non
// devono vedersi tra loro), con lo stesso scaglionamento oltre soglia.
async function generaRichiamoZona({ citta, regione, batchSize }) {
  if (!citta && !regione) {
    const err = new Error('Specificare almeno città o regione.');
    err.statusCode = 400;
    throw err;
  }

  const soglia = batchSize || Number(process.env.UPLOAD_BATCH_SIZE) || DEFAULT_BATCH_SIZE;

  const condizioni = ["stato = 'senza_risposta'"];
  const parametri = [];
  if (citta) {
    parametri.push(citta);
    condizioni.push(`citta = $${parametri.length}`);
  }
  if (regione) {
    parametri.push(regione);
    condizioni.push(`regione = $${parametri.length}`);
  }

  const result = await getPool().query(
    `SELECT email FROM leads WHERE ${condizioni.join(' AND ')} ORDER BY email`,
    parametri
  );
  const destinatari = result.rows;

  if (destinatari.length === 0) {
    return { citta: citta || null, regione: regione || null, numero_destinatari: 0, soglia_batch: soglia, bozze: [] };
  }

  const batches = chunk(destinatari, soglia);
  const bozzeGenerate = await generateDraftsForBatches(batches, { campo: 'bcc' });
  const bozze = bozzeGenerate.map((b) => ({
    numero_batch: b.numeroBatch,
    destinatari: b.destinatari.length,
    uid_bozza_imap: b.uid,
  }));

  await getPool().query(
    `INSERT INTO gruppi_export_richiamo (citta, regione, numero_destinatari, numero_bozze)
     VALUES ($1, $2, $3, $4)`,
    [citta || null, regione || null, destinatari.length, bozze.length]
  );

  return { citta: citta || null, regione: regione || null, numero_destinatari: destinatari.length, soglia_batch: soglia, bozze };
}

async function listRichiamiZona() {
  const result = await getPool().query(
    `SELECT id, citta, regione, numero_destinatari, numero_bozze, data_generazione
     FROM gruppi_export_richiamo ORDER BY data_generazione DESC LIMIT 50`
  );
  return result.rows;
}

module.exports = { generaRichiamoZona, listRichiamiZona };
