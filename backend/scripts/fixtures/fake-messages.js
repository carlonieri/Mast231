// Contatti ed email di prova. Domini example.com/.org/.net riservati alla
// documentazione (RFC 2606): non esistono davvero, nessun rischio di scrivere
// a indirizzi reali.

function buildRawMessage({ from, to, subject, date, body }) {
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Date: ${date.toUTCString()}`,
    `Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@test.mast231.local>`,
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
