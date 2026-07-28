const { getPool } = require('../config/db');
const { parseUploadedFile, isValidEmail } = require('./upload-parser.service');
const { generateDraftsForBatches } = require('./imap-draft.service');
const { registraCambioStato } = require('./leads.service');
const { chunk } = require('../utils/chunk');

const DEFAULT_BATCH_SIZE = 150;
const DEFAULT_SOGLIA_RECENTE_GIORNI = 7;

// Stati per cui riportare un lead nella lista da contattare è una decisione di
// giudizio dell'operatore, non un errore di dati: il sistema non decide da
// solo, si limita a segnalarli in revisione. 'contattato' è segnalato solo se
// il contatto è ancora recente (entro FOLLOWUP_DAYS_THRESHOLD giorni): oltre
// soglia il lead è comunque destinato a "senza risposta" dal job periodico
// flag-no-response-leads.job.js, quindi va bene riproporlo automaticamente.
const STATI_SEMPRE_DA_SEGNALARE = ['acquisito', 'interessato', 'non_interessato'];

async function findEsclusioniMap(emails) {
  if (emails.length === 0) return new Map();
  const placeholders = emails.map((_, i) => `$${i + 1}`).join(', ');
  const result = await getPool().query(
    `SELECT email, motivo FROM esclusioni WHERE email IN (${placeholders})`,
    emails
  );
  return new Map(result.rows.map((r) => [r.email, r.motivo]));
}

async function findLeadEsistentiMap(emails) {
  if (emails.length === 0) return new Map();
  const placeholders = emails.map((_, i) => `$${i + 1}`).join(', ');
  const result = await getPool().query(
    `SELECT email, stato, ultima_data_contatto, updated_at FROM leads WHERE email IN (${placeholders})`,
    emails
  );
  return new Map(result.rows.map((r) => [r.email, r]));
}

// Ritorna il motivo di segnalazione (o null se il lead può rientrare tra i
// puliti automatici) e la data di riferimento da mostrare come "da quanto
// tempo" nella schermata di revisione.
function valutaLeadEsistente(leadEsistente, sogliaRecenteGiorni) {
  if (!leadEsistente) return { motivo: null };

  if (STATI_SEMPRE_DA_SEGNALARE.includes(leadEsistente.stato)) {
    return { motivo: leadEsistente.stato, dataRiferimento: leadEsistente.ultima_data_contatto || leadEsistente.updated_at };
  }

  if (leadEsistente.stato === 'contattato') {
    const dataRiferimento = leadEsistente.ultima_data_contatto || leadEsistente.updated_at;
    const giorni = Math.floor((Date.now() - new Date(dataRiferimento).getTime()) / 86400000);
    if (giorni <= sogliaRecenteGiorni) {
      return { motivo: 'contattato_recente', dataRiferimento };
    }
  }

  return { motivo: null };
}

// Crea il lead se non esiste ancora; se esiste già, aggiorna nome/città/regione
// con i valori del nuovo caricamento quando presenti (il caricamento è la
// fonte dati più aggiornata), altrimenti mantiene quelli già salvati. Lo
// stato non viene mai toccato qui: un ricaricamento non deve far regredire
// un lead già in uno stato più avanzato (interessato, senza_risposta, ecc.).
// INSERT ... ON CONFLICT DO NOTHING (non SELECT-poi-INSERT separati): il
// tentativo di inserimento è atomico, quindi due caricamenti che condividono
// un indirizzo nuovo e finalizzano quasi in contemporanea non vanno più in
// conflitto sul vincolo UNIQUE di leads.email — chi perde la corsa trova
// semplicemente 0 righe inserite e passa all'UPDATE sotto, invece di andare
// in eccezione. 'da_contattare' viene registrato nel percorso stato SOLO
// quando l'INSERT ha davvero inserito una riga — mai su un ricaricamento.
async function upsertLeadFromUpload({ email, nome, citta, regione, caricamentoId }) {
  const inserito = await getPool().query(
    `INSERT INTO leads (email, nome, citta, regione, caricamento_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO NOTHING
     RETURNING id, created_at`,
    [email, nome, citta, regione, caricamentoId]
  );

  if (inserito.rows.length > 0) {
    const { id: leadId, created_at: dataCreazione } = inserito.rows[0];
    await registraCambioStato({ leadId, stato: 'da_contattare', data: dataCreazione, origine: 'automatico' });
    return;
  }

  await getPool().query(
    `UPDATE leads SET
       nome = COALESCE($1, nome),
       citta = COALESCE($2, citta),
       regione = COALESCE($3, regione),
       caricamento_id = $4,
       updated_at = now()
     WHERE email = $5`,
    [nome, citta, regione, caricamentoId, email]
  );
}

// Upsert dei lead della lista finale (puliti automatici + segnalati
// confermati dall'operatore) e generazione delle bozze IMAP scaglionate.
// Unico punto in cui il caricamento tocca davvero il DB e la casella email:
// eseguito subito se non ci sono segnalati, altrimenti solo dopo conferma.
// Se qualcosa fallisce a metà (es. IMAP irraggiungibile durante la
// generazione bozze, dopo che alcuni lead sono già stati creati), il
// caricamento va marcato 'errore' — MAI lasciato/segnato 'completato' se la
// finalizzazione non è davvero riuscita fino in fondo.
async function finalizzaCaricamento({ caricamentoId, pulitiAutomatici, confermati, rimossi, datiComuni, soglia }) {
  const listaFinale = [...pulitiAutomatici, ...confermati];

  try {
    for (const riga of listaFinale) {
      // eslint-disable-next-line no-await-in-loop
      await upsertLeadFromUpload({ ...riga, caricamentoId });
    }

    const batches = chunk(listaFinale, soglia);
    const bozzeGenerate = await generateDraftsForBatches(batches);

    const dettagli = {
      ...datiComuni,
      stato: 'completato',
      puliti_automatici: pulitiAutomatici.length,
      segnalati_revisione: {
        totale: confermati.length + rimossi.length,
        confermati: confermati.map((r) => ({ email: r.email, stato_lead: r.stato_lead, motivo: r.motivo })),
        rimossi: rimossi.map((r) => ({ email: r.email, stato_lead: r.stato_lead, motivo: r.motivo })),
      },
      bozze: bozzeGenerate.map((b) => ({
        numero_batch: b.numeroBatch,
        destinatari: b.destinatari.length,
        uid_bozza_imap: b.uid,
      })),
    };

    await getPool().query(
      'UPDATE caricamenti SET dettagli = $1, stato = $2, revisione_pendente = NULL WHERE id = $3',
      [JSON.stringify(dettagli), 'completato', caricamentoId]
    );

    return { caricamento_id: caricamentoId, ...dettagli };
  } catch (err) {
    const dettagliErrore = {
      ...datiComuni,
      stato: 'errore',
      errore: err.message || 'Errore imprevisto durante la finalizzazione del caricamento.',
    };
    await getPool().query(
      'UPDATE caricamenti SET dettagli = $1, stato = $2, revisione_pendente = NULL WHERE id = $3',
      [JSON.stringify(dettagliErrore), 'errore', caricamentoId]
    );
    throw err;
  }
}

// Carica lista giornaliera: valida, deduplica nel file e controlla la
// blacklist (unici controlli automatici, senza eccezioni). Per ogni indirizzo
// rimasto, se corrisponde a un lead già acquisito/interessato/non interessato/
// contattato di recente, non decide da solo: lo segnala per revisione
// manuale. Se non ci sono indirizzi da segnalare, finalizza subito (nessun
// cambiamento rispetto al comportamento precedente); altrimenti crea il
// caricamento in stato 'in_revisione' e aspetta la conferma dell'operatore
// (vedi confermaRevisione) prima di creare/aggiornare lead o generare bozze.
async function processUpload({ buffer, fonte, citta, regione, caricatoDa, batchSize }) {
  const soglia = batchSize || Number(process.env.UPLOAD_BATCH_SIZE) || DEFAULT_BATCH_SIZE;
  const sogliaRecenteGiorni = Number(process.env.FOLLOWUP_DAYS_THRESHOLD) || DEFAULT_SOGLIA_RECENTE_GIORNI;

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
  // Non è una questione di giudizio (solo un errore di battitura/dati), quindi
  // resta un controllo automatico.
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

  // Controllo automatico contro la blacklist (tabella esclusioni) — motivi
  // legali/privacy, sempre automatico e senza eccezioni.
  const esclusioniMap = await findEsclusioniMap(righeUniche.map((r) => r.email));
  const esclusiBlacklist = [];
  const daValutare = [];
  for (const riga of righeUniche) {
    const motivo = esclusioniMap.get(riga.email);
    if (motivo) {
      esclusiBlacklist.push({ email: riga.email, motivo });
    } else {
      daValutare.push(riga);
    }
  }

  // Stato del lead già presente in DB (se esiste): separa i puliti automatici
  // dagli indirizzi da segnalare in revisione manuale.
  const leadEsistentiMap = await findLeadEsistentiMap(daValutare.map((r) => r.email));
  const pulitiAutomatici = [];
  const segnalati = [];
  for (const riga of daValutare) {
    const { motivo, dataRiferimento } = valutaLeadEsistente(leadEsistentiMap.get(riga.email), sogliaRecenteGiorni);
    if (motivo) {
      segnalati.push({
        ...riga,
        stato_lead: leadEsistentiMap.get(riga.email).stato,
        data_riferimento: dataRiferimento,
        motivo,
      });
    } else {
      pulitiAutomatici.push(riga);
    }
  }

  const caricamentoResult = await getPool().query(
    `INSERT INTO caricamenti (fonte, citta, regione, numero_record, caricato_da, stato)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [fonte, citta || null, regione || null, totaleRighe, caricatoDa || null, segnalati.length > 0 ? 'in_revisione' : 'in_elaborazione']
  );
  const caricamentoId = caricamentoResult.rows[0].id;

  const datiComuni = {
    totale_righe: totaleRighe,
    righe_non_valide: righeNonValide,
    duplicati_nel_file: duplicatiNelFile,
    esclusi_blacklist: esclusiBlacklist,
    soglia_batch: soglia,
  };

  if (segnalati.length === 0) {
    return finalizzaCaricamento({ caricamentoId, pulitiAutomatici, confermati: [], rimossi: [], datiComuni, soglia });
  }

  const dettagli = {
    ...datiComuni,
    stato: 'in_revisione',
    puliti_automatici: pulitiAutomatici.length,
    segnalati: segnalati.map((s) => ({
      email: s.email,
      nome: s.nome,
      citta: s.citta,
      regione: s.regione,
      stato_lead: s.stato_lead,
      data_riferimento: s.data_riferimento,
      motivo: s.motivo,
    })),
  };

  await getPool().query(
    'UPDATE caricamenti SET dettagli = $1, revisione_pendente = $2 WHERE id = $3',
    [JSON.stringify(dettagli), JSON.stringify({ pulitiAutomatici, segnalati, datiComuni, soglia }), caricamentoId]
  );

  return { caricamento_id: caricamentoId, ...dettagli };
}

// Finalizza un caricamento 'in_revisione' in base alle decisioni
// dell'operatore (una per ogni indirizzo segnalato: 'tieni' o 'escludi').
// Solo da qui in poi vengono creati/aggiornati i lead e generate le bozze.
async function confermaRevisione({ caricamentoId, decisioni }) {
  const result = await getPool().query('SELECT stato, revisione_pendente FROM caricamenti WHERE id = $1', [caricamentoId]);
  const row = result.rows[0];
  if (!row) {
    const err = new Error('Caricamento non trovato.');
    err.statusCode = 404;
    throw err;
  }
  if (row.stato !== 'in_revisione') {
    const err = new Error('Questo caricamento non è in attesa di revisione.');
    err.statusCode = 409;
    throw err;
  }

  const { pulitiAutomatici, segnalati, datiComuni, soglia } = row.revisione_pendente;

  const decisioniMap = new Map((decisioni || []).map((d) => [d.email, d.azione]));
  const mancanti = segnalati.filter((s) => !decisioniMap.has(s.email));
  if (mancanti.length > 0) {
    const err = new Error(
      `Manca la decisione (tieni/escludi) per ${mancanti.length} indirizzi segnalati: ${mancanti.map((m) => m.email).join(', ')}.`
    );
    err.statusCode = 400;
    throw err;
  }

  const confermati = [];
  const rimossi = [];
  for (const s of segnalati) {
    if (decisioniMap.get(s.email) === 'tieni') {
      confermati.push(s);
    } else {
      rimossi.push(s);
    }
  }

  return finalizzaCaricamento({ caricamentoId, pulitiAutomatici, confermati, rimossi, datiComuni, soglia });
}

module.exports = { processUpload, confermaRevisione };
