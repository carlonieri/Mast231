const { getPool } = require('../config/db');
const { parseUploadedFile, isValidEmail } = require('./upload-parser.service');
const { generateDraftsForBatches } = require('./imap-draft.service');

const DEFAULT_BATCH_SIZE = 150;

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function findEsclusioniMap(emails) {
  if (emails.length === 0) return new Map();
  const placeholders = emails.map((_, i) => `$${i + 1}`).join(', ');
  const result = await getPool().query(
    `SELECT email, motivo FROM esclusioni WHERE email IN (${placeholders})`,
    emails
  );
  return new Map(result.rows.map((r) => [r.email, r.motivo]));
}

// Crea il lead se non esiste ancora; se esiste già, aggiorna nome/città/regione
// con i valori del nuovo caricamento quando presenti (il caricamento è la
// fonte dati più aggiornata), altrimenti mantiene quelli già salvati. Lo
// stato non viene mai toccato qui: un ricaricamento non deve far regredire
// un lead già in uno stato più avanzato (interessato, senza_risposta, ecc.).
async function upsertLeadFromUpload({ email, nome, citta, regione, caricamentoId }) {
  await getPool().query(
    `INSERT INTO leads (email, nome, citta, regione, caricamento_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET
       nome = COALESCE(EXCLUDED.nome, leads.nome),
       citta = COALESCE(EXCLUDED.citta, leads.citta),
       regione = COALESCE(EXCLUDED.regione, leads.regione),
       caricamento_id = EXCLUDED.caricamento_id,
       updated_at = now()`,
    [email, nome, citta, regione, caricamentoId]
  );
}

// Carica lista giornaliera: valida, deduplica, controlla la blacklist e
// genera le bozze IMAP con i destinatari puliti (max batchSize per bozza).
// Vedi conversazione con l'utente per i dettagli di business (non presenti
// nella spec scritta): output = bozza IMAP reale, >150 destinatari = più
// bozze automatiche, riepilogo con elenco esclusi, solo email obbligatoria.
async function processUpload({ buffer, fonte, citta, regione, caricatoDa, batchSize }) {
  const soglia = batchSize || Number(process.env.UPLOAD_BATCH_SIZE) || DEFAULT_BATCH_SIZE;

  const righeGrezze = await parseUploadedFile(buffer, fonte);
  const totaleRighe = righeGrezze.length;

  const righeValide = [];
  let righeNonValide = 0;
  for (const riga of righeGrezze) {
    if (!isValidEmail(riga.email)) {
      righeNonValide += 1;
      continue;
    }
    righeValide.push({
      email: riga.email,
      nome: riga.nome,
      citta: riga.citta || citta || null,
      regione: riga.regione || regione || null,
    });
  }

  // Deduplica interna al file: mantiene la prima occorrenza di ogni indirizzo.
  const visti = new Set();
  const righeUniche = [];
  let duplicatiNelFile = 0;
  for (const riga of righeValide) {
    if (visti.has(riga.email)) {
      duplicatiNelFile += 1;
      continue;
    }
    visti.add(riga.email);
    righeUniche.push(riga);
  }

  // Controllo automatico contro la blacklist (tabella esclusioni).
  const esclusioniMap = await findEsclusioniMap(righeUniche.map((r) => r.email));
  const esclusiBlacklist = [];
  const puliti = [];
  for (const riga of righeUniche) {
    const motivo = esclusioniMap.get(riga.email);
    if (motivo) {
      esclusiBlacklist.push({ email: riga.email, motivo });
    } else {
      puliti.push(riga);
    }
  }

  const caricamentoResult = await getPool().query(
    `INSERT INTO caricamenti (fonte, citta, regione, numero_record, caricato_da)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [fonte, citta || null, regione || null, totaleRighe, caricatoDa || null]
  );
  const caricamentoId = caricamentoResult.rows[0].id;

  for (const riga of puliti) {
    // eslint-disable-next-line no-await-in-loop
    await upsertLeadFromUpload({ ...riga, caricamentoId });
  }

  // Scaglionamento oltre la soglia: una bozza IMAP per ciascun batch.
  const batches = chunk(puliti, soglia);
  const bozzeGenerate = await generateDraftsForBatches(batches);

  const dettagli = {
    totale_righe: totaleRighe,
    righe_non_valide: righeNonValide,
    duplicati_nel_file: duplicatiNelFile,
    esclusi_blacklist: esclusiBlacklist,
    puliti: puliti.length,
    soglia_batch: soglia,
    bozze: bozzeGenerate.map((b) => ({
      numero_batch: b.numeroBatch,
      destinatari: b.destinatari.length,
      uid_bozza_imap: b.uid,
    })),
  };

  await getPool().query('UPDATE caricamenti SET dettagli = $1 WHERE id = $2', [
    JSON.stringify(dettagli),
    caricamentoId,
  ]);

  return { caricamento_id: caricamentoId, ...dettagli };
}

module.exports = { processUpload };
