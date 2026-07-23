const Anthropic = require('@anthropic-ai/sdk');

let client;

function getClient() {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const CATEGORY_SCHEMA = {
  type: 'object',
  properties: {
    categoria: {
      type: 'string',
      description:
        "Etichetta breve (2-5 parole, in italiano) che riassume l'argomento principale dell'email, es. \"Antiriciclaggio D.Lgs 231/2007\", \"GDPR privacy\", \"Whistleblowing\".",
    },
  },
  required: ['categoria'],
  additionalProperties: false,
};

const SYSTEM_PROMPT = [
  "Sei un assistente che categorizza le email inviate da Mast Srls, società di consulenza compliance",
  '(antiriciclaggio D.Lgs 231/2007, GDPR, D.Lgs 231/2001, whistleblowing) a commercialisti, avvocati,',
  'notai e consulenti del lavoro. Leggi oggetto e testo di un\'email inviata e rispondi SOLO con una',
  "categoria breve che ne riassume l'argomento principale, per permettere di capire a colpo d'occhio",
  'di cosa trattava un invio senza doverlo rileggere.',
].join(' ');

// Categorizza un'email inviata (oggetto + corpo) restituendo un'etichetta sintetica.
// Vedi docs/mast231_gestionale_spec.md, requisito funzionale #1.
async function categorizeSentEmail({ oggetto, corpo }) {
  const response = await getClient().messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    output_config: {
      format: { type: 'json_schema', schema: CATEGORY_SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: `Oggetto: ${oggetto || '(nessun oggetto)'}\n\nTesto:\n${corpo || '(vuoto)'}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  const parsed = JSON.parse(textBlock.text);
  return parsed.categoria;
}

const REPLY_CLASSIFICATION_SCHEMA = {
  type: 'object',
  properties: {
    classificazione: {
      type: 'string',
      enum: ['interessato', 'non_interessato', 'rimozione', 'ambiguo'],
      description: 'Categoria della risposta secondo le 4 classi definite dalla specifica.',
    },
  },
  required: ['classificazione'],
  additionalProperties: false,
};

const REPLY_SYSTEM_PROMPT = [
  'Sei un assistente che classifica le risposte ricevute da prospect contattati da Mast Srls,',
  'società di consulenza compliance (antiriciclaggio, GDPR, whistleblowing). Classifica la risposta',
  'in una di queste 4 categorie, senza eccezioni:',
  '- interessato: il mittente mostra interesse, ad esempio chiede un preventivo, maggiori informazioni o un appuntamento.',
  '- non_interessato: il mittente dichiara esplicitamente di non essere interessato o di avere già un fornitore.',
  '- rimozione: il mittente chiede esplicitamente di essere rimosso dalla lista o di non essere più contattato.',
  '- ambiguo: la risposta non permette di capire chiaramente se il mittente sia interessato o meno.',
  "Questo testo è già stato filtrato a monte: non è un bounce né una risposta automatica di assenza,",
  'è una risposta scritta da una persona.',
].join(' ');

// Classifica una risposta umana (già esclusi bounce e auto-reply a monte) in
// una delle 4 categorie della spec. Vedi docs/mast231_gestionale_spec.md,
// requisito funzionale #4.
async function classifyReply({ oggetto, corpo }) {
  const response = await getClient().messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 256,
    system: REPLY_SYSTEM_PROMPT,
    output_config: {
      format: { type: 'json_schema', schema: REPLY_CLASSIFICATION_SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: `Oggetto: ${oggetto || '(nessun oggetto)'}\n\nTesto:\n${corpo || '(vuoto)'}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  const parsed = JSON.parse(textBlock.text);
  return parsed.classificazione;
}

module.exports = { categorizeSentEmail, classifyReply };
