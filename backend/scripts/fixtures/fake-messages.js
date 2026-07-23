// Contatti ed email di prova. Domini example.com/.org/.net riservati alla
// documentazione (RFC 2606): non esistono davvero, nessun rischio di scrivere
// a indirizzi reali.

function buildRawMessage({ from, to, subject, date, body, extraHeaders = {} }) {
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Date: ${date.toUTCString()}`,
    `Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@test.mast231.local>`,
    ...Object.entries(extraHeaders).map(([key, value]) => `${key}: ${value}`),
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
    '',
  ].join('\r\n');
}

// Email finte in "Posta Inviata" (invii simulati dell'operatore verso prospect)
const sentFixtures = [
  {
    from: 'ufficio@mast-test.local',
    to: 'avvocato.bianchi@example.com',
    subject: 'Servizi di consulenza antiriciclaggio D.Lgs 231/2007',
    body: 'Buongiorno, le scriviamo per presentare i nostri servizi di consulenza in materia di antiriciclaggio rivolti a studi legali. Restiamo a disposizione per un confronto.',
    daysAgo: 10,
  },
  {
    from: 'ufficio@mast-test.local',
    to: 'studio.verdi@example.org',
    subject: 'GDPR e adeguamento privacy per studi professionali',
    body: 'Buongiorno, offriamo un servizio di adeguamento GDPR pensato per studi professionali. Se interessati, siamo disponibili per una call conoscitiva.',
    daysAgo: 7,
  },
  {
    from: 'ufficio@mast-test.local',
    to: 'notaio.russo@example.net',
    subject: 'Whistleblowing: obblighi normativi 2026',
    body: 'Buongiorno, la informiamo sui nuovi obblighi in materia di whistleblowing (D.Lgs 231/2001) e su come possiamo supportarla nell’adeguamento.',
    daysAgo: 5,
  },
];

// Email finte in "Posta in Arrivo" (risposte simulate dei prospect, con classificazioni diverse)
const inboxFixtures = [
  {
    from: 'avvocato.bianchi@example.com',
    to: 'ufficio@mast-test.local',
    subject: 'Re: Servizi di consulenza antiriciclaggio D.Lgs 231/2007',
    body: 'Buongiorno, sono interessato: potreste inviarmi un preventivo dettagliato per il mio studio?',
    daysAgo: 9,
  },
  {
    from: 'studio.verdi@example.org',
    to: 'ufficio@mast-test.local',
    subject: 'Re: GDPR e adeguamento privacy per studi professionali',
    body: 'Grazie per il contatto, al momento non siamo interessati: abbiamo già un consulente per questo ambito.',
    daysAgo: 6,
  },
  {
    from: 'notaio.russo@example.net',
    to: 'ufficio@mast-test.local',
    subject: 'Re: Whistleblowing: obblighi normativi 2026',
    body: 'Vi prego di rimuovere il mio indirizzo da ogni contatto futuro, non desidero ricevere altre comunicazioni.',
    daysAgo: 4,
  },
  {
    from: 'commercialista.ferrari@example.com',
    to: 'ufficio@mast-test.local',
    subject: 'Informazioni',
    body: 'Buongiorno, ho ricevuto la vostra email. Potreste dirmi qualcosa in più sui vostri servizi?',
    daysAgo: 2,
  },
  // Risposta automatica di assenza (fuori sede) — non è una vera risposta del
  // destinatario e non deve essere classificata come interessato/non interessato.
  {
    from: 'avvocato.gialli@example.org',
    to: 'ufficio@mast-test.local',
    subject: 'Risposta automatica: Servizi di consulenza antiriciclaggio D.Lgs 231/2007',
    body: 'Sono attualmente fuori sede fino al 30 del mese. Per urgenze contattare lo studio al numero indicato in firma.',
    extraHeaders: { 'Auto-Submitted': 'auto-replied' },
    daysAgo: 3,
  },
  // Bounce (mancato recapito) — l'indirizzo non esiste più o è errato: il
  // mittente è il server di posta, non il contatto, e va correlato al lead
  // tramite l'indirizzo riportato nel corpo/header del messaggio di errore.
  {
    from: 'mailer-daemon@example.com',
    to: 'ufficio@mast-test.local',
    subject: 'Undelivered Mail Returned to Sender',
    body: [
      'Il messaggio non è stato recapitato al seguente destinatario:',
      '',
      'studio.conti@example.com',
      '',
      'Motivo: indirizzo email non valido (550 5.1.1 user unknown).',
    ].join('\r\n'),
    extraHeaders: { 'X-Failed-Recipients': 'studio.conti@example.com' },
    daysAgo: 1,
  },
];

function withDate(fixture) {
  const date = new Date();
  date.setDate(date.getDate() - fixture.daysAgo);
  return { ...fixture, date };
}

module.exports = {
  buildRawMessage,
  sentFixtures: sentFixtures.map(withDate),
  inboxFixtures: inboxFixtures.map(withDate),
};
