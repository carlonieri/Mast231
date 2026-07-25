// Popola il database locale con dati finti realistici, per vedere il
// gestionale nel browser senza dover collegare IMAP/Claude reali. Scrive
// direttamente nelle tabelle (bypassa i job IMAP e la Batch API): copre tutti
// gli stati lead, entrambe le direzioni di email_events (inviata/ricevuta,
// incluse categorie bounce e risposta_automatica_assenza), richiami di oggi e
// futuri, esclusioni ed un caricamento di esempio.
//
// Uso: npm run db:seed-demo
// ATTENZIONE: svuota (TRUNCATE) le tabelle del gestionale prima di ripopolarle
// — pensato per un database locale di sviluppo, non lanciarlo su un database
// con dati reali.

require('dotenv').config();
const { getPool } = require('../src/config/db');
const { creaUtente } = require('../src/services/auth.service');

// Password identiche e semplici: solo per la demo locale, mai usarle altrove.
const UTENTI_DEMO = [
  { nome: 'Maria Titolare', email: 'titolare@demo.it', password: 'demo1234', ruolo: 'titolare' },
  { nome: 'Luca Operatore', email: 'operatore@demo.it', password: 'demo1234', ruolo: 'operatore' },
];

function giorniFa(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const LEADS = [
  {
    email: 'avv.bianchi@studiobianchi-demo.it',
    nome: 'Avv. Bianchi',
    citta: 'Bologna',
    regione: 'Emilia-Romagna',
    stato: 'interessato',
    inviata: { giorniFa: 6, oggetto: 'Servizi di consulenza antiriciclaggio D.Lgs 231/2007', categoria: 'Antiriciclaggio D.Lgs 231/2007' },
    ricevuta: { giorniFa: 5, oggetto: 'Re: Servizi di consulenza antiriciclaggio D.Lgs 231/2007', categoria: 'interessato' },
    richiamo: {
      giorniFa: 0,
      motivo: 'Lead interessato — contattare (oggetto: "Re: Servizi di consulenza antiriciclaggio D.Lgs 231/2007")',
      assegnaTitolare: true,
    },
  },
  {
    email: 'info@studioverdi-demo.it',
    nome: 'Studio Verdi',
    citta: 'Milano',
    regione: 'Lombardia',
    stato: 'non_interessato',
    inviata: { giorniFa: 12, oggetto: 'GDPR e adeguamento privacy per studi professionali', categoria: 'GDPR privacy' },
    ricevuta: { giorniFa: 10, oggetto: 'Re: GDPR e adeguamento privacy per studi professionali', categoria: 'non_interessato' },
  },
  {
    email: 'commercialista.ferrari@demo-consulenza.it',
    nome: 'Comm. Ferrari',
    citta: 'Roma',
    regione: 'Lazio',
    stato: 'contattato',
    inviata: { giorniFa: 3, oggetto: 'Whistleblowing: obblighi normativi 2026', categoria: 'Whistleblowing' },
  },
  {
    email: 'notaio.gialli@demo-notariato.it',
    nome: 'Notaio Gialli',
    citta: 'Firenze',
    regione: 'Toscana',
    stato: 'da_contattare',
  },
  {
    email: 'studio.neri@demo-legale.it',
    nome: 'Studio Neri',
    citta: 'Torino',
    regione: 'Piemonte',
    stato: 'senza_risposta',
    inviata: { giorniFa: 15, oggetto: 'Servizi di consulenza antiriciclaggio D.Lgs 231/2007', categoria: 'Antiriciclaggio D.Lgs 231/2007' },
    richiamo: { giorniFa: 0, motivo: 'Nessuna risposta da oltre 7 giorni — richiamare' },
  },
  {
    email: 'avv.rossi@demo-legale.it',
    nome: 'Avv. Rossi',
    citta: 'Napoli',
    regione: 'Campania',
    stato: 'acquisito',
    inviata: { giorniFa: 70, oggetto: 'GDPR e adeguamento privacy per studi professionali', categoria: 'GDPR privacy' },
    ricevuta: { giorniFa: 68, oggetto: 'Re: GDPR e adeguamento privacy per studi professionali', categoria: 'interessato' },
  },
  {
    email: 'commercialista.blu@demo-consulenza.it',
    nome: 'Comm. Blu',
    citta: 'Bologna',
    regione: 'Emilia-Romagna',
    stato: 'interessato',
    inviata: { giorniFa: 2, oggetto: 'Whistleblowing: obblighi normativi 2026', categoria: 'Whistleblowing' },
    ricevuta: { giorniFa: 1, oggetto: 'Re: Whistleblowing: obblighi normativi 2026', categoria: 'interessato' },
    richiamo: { giorniFa: 0, motivo: 'Lead interessato — contattare (oggetto: "Re: Whistleblowing: obblighi normativi 2026")' },
  },
  {
    email: 'info@studiorosa-demo.it',
    nome: 'Studio Rosa',
    citta: 'Milano',
    regione: 'Lombardia',
    stato: 'senza_risposta',
    inviata: { giorniFa: 20, oggetto: 'GDPR e adeguamento privacy per studi professionali', categoria: 'GDPR privacy' },
    richiamo: { giorniFa: -2, motivo: 'Nessuna risposta da oltre 7 giorni — richiamare' },
  },
  {
    email: 'consulente.marroni@demo-consulenza.it',
    nome: 'Consulente Marroni',
    citta: 'Roma',
    regione: 'Lazio',
    stato: 'contattato',
    inviata: { giorniFa: 4, oggetto: 'Servizi di consulenza antiriciclaggio D.Lgs 231/2007', categoria: 'Antiriciclaggio D.Lgs 231/2007' },
    ricevuta: { giorniFa: 3, oggetto: 'Undelivered Mail Returned to Sender', categoria: 'bounce' },
  },
  {
    email: 'avv.conti@demo-legale.it',
    nome: 'Avv. Conti',
    citta: 'Torino',
    regione: 'Piemonte',
    stato: 'contattato',
    inviata: { giorniFa: 5, oggetto: 'Whistleblowing: obblighi normativi 2026', categoria: 'Whistleblowing' },
    ricevuta: { giorniFa: 4, oggetto: 'Risposta automatica: Whistleblowing: obblighi normativi 2026', categoria: 'risposta_automatica_assenza' },
  },
];

const ESCLUSIONI = [
  { email: 'ex.studiolegale@demo-legale.it', motivo: 'Richiesta di rimozione ricevuta via risposta email', giorniFa: 8 },
  { email: 'vecchio.contatto@demo-consulenza.it', motivo: 'Richiesta di rimozione ricevuta via risposta email', giorniFa: 30 },
  { email: 'bloccato.manualmente@demo-legale.it', motivo: 'Bounce permanente — indirizzo non più attivo', giorniFa: 3 },
];

async function inserisciLead(pool, lead, titolareId) {
  const ultimaData = lead.ricevuta?.giorniFa ?? lead.inviata?.giorniFa;
  const ultimaCategoria = lead.ricevuta?.categoria === 'bounce' || lead.ricevuta?.categoria === 'risposta_automatica_assenza'
    ? lead.inviata?.categoria
    : lead.ricevuta?.categoria || lead.inviata?.categoria || null;

  const result = await pool.query(
    `INSERT INTO leads (email, nome, citta, regione, stato, ultima_categoria_email, ultima_data_contatto)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      lead.email,
      lead.nome,
      lead.citta,
      lead.regione,
      lead.stato,
      ultimaCategoria,
      ultimaData !== undefined ? giorniFa(ultimaData) : null,
    ]
  );
  const leadId = result.rows[0].id;

  if (lead.inviata) {
    await pool.query(
      `INSERT INTO email_events (lead_id, direzione, data, oggetto, categoria, fonte)
       VALUES ($1, 'inviata', $2, $3, $4, 'sent_items')`,
      [leadId, giorniFa(lead.inviata.giorniFa), lead.inviata.oggetto, lead.inviata.categoria]
    );
  }
  if (lead.ricevuta) {
    await pool.query(
      `INSERT INTO email_events (lead_id, direzione, data, oggetto, categoria, fonte)
       VALUES ($1, 'ricevuta', $2, $3, $4, 'inbox')`,
      [leadId, giorniFa(lead.ricevuta.giorniFa), lead.ricevuta.oggetto, lead.ricevuta.categoria]
    );
  }
  if (lead.richiamo) {
    await pool.query(
      `INSERT INTO follow_up (lead_id, data_suggerita, motivo, stato, assegnato_a)
       VALUES ($1, $2, $3, 'da_fare', $4)`,
      [leadId, giorniFa(lead.richiamo.giorniFa), lead.richiamo.motivo, lead.richiamo.assegnaTitolare ? titolareId : null]
    );
  }
}

// Riutilizzabile sia dal CLI (npm run db:seed-demo, contro un Postgres vero)
// sia dalla modalità demo in memoria (npm run demo, senza Postgres installato).
async function seedDemoData(pool) {
  console.log('Svuoto le tabelle del gestionale (TRUNCATE)...');
  // utenti prima: follow_up.assegnato_a la referenzia, e caricamenti -> CASCADE
  // su leads -> CASCADE su email_events/follow_up svuota comunque i richiami.
  await pool.query('TRUNCATE TABLE utenti RESTART IDENTITY CASCADE');
  await pool.query('TRUNCATE TABLE caricamenti RESTART IDENTITY CASCADE');
  await pool.query('TRUNCATE TABLE esclusioni RESTART IDENTITY CASCADE');
  await pool.query('TRUNCATE TABLE categorizzazioni_batch RESTART IDENTITY CASCADE');

  console.log(`Creo ${UTENTI_DEMO.length} account di esempio...`);
  let titolareId = null;
  for (const u of UTENTI_DEMO) {
    // eslint-disable-next-line no-await-in-loop
    const creato = await creaUtente(u);
    if (u.ruolo === 'titolare') titolareId = creato.id;
  }

  console.log(`Inserisco ${LEADS.length} lead di esempio...`);
  for (const lead of LEADS) {
    // eslint-disable-next-line no-await-in-loop
    await inserisciLead(pool, lead, titolareId);
  }

  console.log(`Inserisco ${ESCLUSIONI.length} esclusioni di esempio...`);
  for (const e of ESCLUSIONI) {
    // eslint-disable-next-line no-await-in-loop
    await pool.query('INSERT INTO esclusioni (email, motivo, data) VALUES ($1, $2, $3)', [
      e.email,
      e.motivo,
      giorniFa(e.giorniFa),
    ]);
  }

  console.log('Inserisco un caricamento di esempio...');
  await pool.query(
    `INSERT INTO caricamenti (fonte, citta, regione, numero_record, caricato_da, dettagli, data_caricamento)
     VALUES ($1, NULL, NULL, $2, $3, $4, $5)`,
    [
      'lista-contatti-demo.xlsx',
      12,
      'demo',
      JSON.stringify({
        totale_righe: 12,
        righe_non_valide: 1,
        duplicati_nel_file: 1,
        esclusi_blacklist: [{ email: 'bloccato.manualmente@demo-legale.it', motivo: 'Bounce permanente — indirizzo non più attivo' }],
        puliti: 9,
        soglia_batch: 150,
        bozze: [{ numero_batch: 1, destinatari: 9, uid_bozza_imap: 1 }],
      }),
      giorniFa(2),
    ]
  );

  console.log('\nFatto. Dati di esempio inseriti:');
  console.log(`  ${UTENTI_DEMO.length} account (titolare@demo.it / operatore@demo.it, password: demo1234)`);
  console.log(`  ${LEADS.length} lead (tutti gli stati rappresentati)`);
  console.log(`  ${ESCLUSIONI.length} esclusioni`);
  console.log('  1 caricamento di esempio');
  console.log('  Richiami di oggi: 3 (Bianchi già preso in carico dal titolare, Neri e Blu non assegnati)');
}

module.exports = { seedDemoData };

if (require.main === module) {
  seedDemoData(getPool())
    .then(() => getPool().end())
    .catch((err) => {
      console.error('Errore durante il seed dei dati demo:', err);
      process.exit(1);
    });
}
