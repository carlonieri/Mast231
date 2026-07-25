// Avvia il backend in modalità DEMO: nessun Postgres reale richiesto, il
// database gira interamente in memoria (pg-mem) e viene già popolato con dati
// finti realistici (vedi seed-demo-data.js) ad ogni avvio. Pensato per vedere
// il gestionale nel browser (aspetto + funzionalità) senza dover installare
// Postgres né avere ancora credenziali IMAP/Claude reali.
//
// I dati si azzerano ad ogni riavvio: NON persistono, è solo una vetrina.
// L'upload "Carica lista giornaliera" funziona (bozza finta, stessa forma di
// quella reale). Restano non disponibili in questa modalità solo le
// funzionalità che richiedono una vera casella email (i job di lettura Posta
// Inviata/Arrivo) o una vera chiave Claude (assistente in-app).
//
// Login demo: titolare@demo.it / operatore@demo.it, password "demo1234".
//
// Uso: npm run demo

const fs = require('fs');
const path = require('path');
const { newDb } = require('pg-mem');

const db = newDb({ autoCreateForeignKeyIndices: true });
db.public.registerFunction({ name: 'now', returns: 'timestamp', implementation: () => new Date() });
db.public.none(fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8'));
const { Pool } = db.adapters.createPg();
const pool = new Pool();

// Sostituisce il modulo di connessione reale con questo pool in memoria,
// PRIMA che qualsiasi altro file dell'app (index.js, le route, i servizi) lo
// richieda: tutto il resto del codice applicativo resta invariato, non sa di
// non stare parlando con un vero Postgres.
const dbConfigPath = require.resolve('../src/config/db.js');
require.cache[dbConfigPath] = {
  id: dbConfigPath,
  filename: dbConfigPath,
  loaded: true,
  exports: { getPool: () => pool },
};

process.env.PORT = process.env.PORT || '3000';
// Evita connect-pg-simple (le sue query sul salvataggio sessione non sono
// compatibili con l'emulatore in memoria): in demo si usa lo store di default
// di express-session, va benissimo per un solo processo che si azzera al riavvio.
process.env.DEMO_MODE = 'true';

// L'emulatore in memoria (pg-mem) non regge GROUP BY su un'espressione
// calcolata (es. date_trunc/to_char su una colonna timestamp) — è un suo
// limite noto, non riguarda dashboard.service.js che resta corretto ed
// invariato per il Postgres reale. Qui, solo per la modalità demo, si
// sostituisce con un equivalente che raggruppa i mesi in JavaScript invece
// che in SQL, stessa forma del risultato.
async function getAndamentoMensileDemo() {
  const eventi = await pool.query('SELECT direzione, data, categoria FROM email_events');
  const optOut = await pool.query('SELECT data FROM esclusioni');

  const chiaveMese = (data) => {
    const d = new Date(data);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  };

  const eventiPerMese = new Map();
  for (const r of eventi.rows) {
    const mese = chiaveMese(r.data);
    if (!eventiPerMese.has(mese)) eventiPerMese.set(mese, { email_inviate: 0, risposte_ricevute: 0, interessati: 0 });
    const bucket = eventiPerMese.get(mese);
    if (r.direzione === 'inviata') bucket.email_inviate += 1;
    if (r.direzione === 'ricevuta' && !['bounce', 'risposta_automatica_assenza'].includes(r.categoria)) {
      bucket.risposte_ricevute += 1;
    }
    if (r.direzione === 'ricevuta' && r.categoria === 'interessato') bucket.interessati += 1;
  }

  const optOutPerMese = new Map();
  for (const r of optOut.rows) {
    const mese = chiaveMese(r.data);
    optOutPerMese.set(mese, (optOutPerMese.get(mese) || 0) + 1);
  }

  const mesi = new Set([...eventiPerMese.keys(), ...optOutPerMese.keys()]);
  return [...mesi].sort().map((mese) => {
    const riga = eventiPerMese.get(mese) || { email_inviate: 0, risposte_ricevute: 0, interessati: 0 };
    return {
      mese,
      email_inviate: riga.email_inviate,
      risposte_ricevute: riga.risposte_ricevute,
      tasso_risposta: riga.email_inviate > 0 ? Number((riga.risposte_ricevute / riga.email_inviate).toFixed(3)) : 0,
      interessati: riga.interessati,
      opt_out: optOutPerMese.get(mese) || 0,
    };
  });
}

const dashboardServicePath = require.resolve('../src/services/dashboard.service.js');
require.cache[dashboardServicePath] = {
  id: dashboardServicePath,
  filename: dashboardServicePath,
  loaded: true,
  exports: { getAndamentoMensile: getAndamentoMensileDemo },
};

// "Carica lista giornaliera" e il richiamo "senza risposta" per zona generano
// una bozza reale via IMAP (unica scrittura del progetto) — non disponibile
// in modalità demo (nessuna casella vera). Qui si finge l'esito con la stessa
// forma del risultato reale (il parametro campo/'to'/'bcc' è accettato ma
// irrilevante per la finzione, non c'è una vera bozza da popolare).
let prossimoUidFinto = 1000;
async function generateDraftsForBatchesDemo(batches) {
  if (!batches || batches.length === 0) return [];
  return batches.map((batch, i) => ({
    numeroBatch: i + 1,
    destinatari: batch.map((riga) => riga.email),
    // eslint-disable-next-line no-plusplus
    uid: prossimoUidFinto++,
  }));
}

const imapDraftServicePath = require.resolve('../src/services/imap-draft.service.js');
require.cache[imapDraftServicePath] = {
  id: imapDraftServicePath,
  filename: imapDraftServicePath,
  loaded: true,
  exports: { generateDraftsForBatches: generateDraftsForBatchesDemo },
};

async function main() {
  const { seedDemoData } = require('./seed-demo-data');
  await seedDemoData(pool);

  console.log('\n' + '='.repeat(60));
  console.log('MODALITÀ DEMO — dati finti, nessun Postgres reale, si azzera al riavvio');
  console.log('='.repeat(60));

  require('../src/index.js');
}

main().catch((err) => {
  console.error('Errore nell\'avvio del server demo:', err);
  process.exit(1);
});
