-- Mast231 — schema Postgres iniziale
-- Vedi docs/mast231_gestionale_spec.md sezione 3 ("Architettura proposta") per il contesto.
-- Solo struttura: nessuna funzionalità applicativa è ancora collegata a queste tabelle.

CREATE TABLE caricamenti (
  id SERIAL PRIMARY KEY,
  fonte TEXT,                    -- es. nome file importato
  citta TEXT,
  regione TEXT,
  numero_record INTEGER,
  caricato_da TEXT,              -- operatore che ha effettuato il caricamento
  note TEXT,
  dettagli JSONB,                -- riepilogo strutturato: validazione, dedup, blacklist, bozze generate
  data_caricamento TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  nome TEXT,
  citta TEXT,
  regione TEXT,
  -- 'acquisito' non è raggiunto da nessun automatismo: nessun segnale email
  -- indica che un prospect è diventato cliente pagante, quindi è impostato a
  -- mano da un operatore (PATCH /api/leads/:id) — vedi sezione "Clienti già
  -- acquisiti" del gestionale (spec, requisito funzionale #6).
  stato TEXT NOT NULL DEFAULT 'da_contattare'
    CHECK (stato IN ('da_contattare', 'contattato', 'interessato', 'non_interessato', 'senza_risposta', 'escluso', 'acquisito')),
  ultima_categoria_email TEXT,
  ultima_data_contatto TIMESTAMPTZ,
  caricamento_id INTEGER REFERENCES caricamenti(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE email_events (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  direzione TEXT NOT NULL CHECK (direzione IN ('inviata', 'ricevuta')),
  data TIMESTAMPTZ NOT NULL,
  oggetto TEXT,
  categoria TEXT,                -- assegnata da Claude
  fonte TEXT NOT NULL CHECK (fonte IN ('sent_items', 'inbox')),
  message_id TEXT,               -- header Message-ID IMAP, per evitare doppioni sui poll successivi
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE follow_up (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  data_suggerita DATE,
  motivo TEXT,
  stato TEXT NOT NULL DEFAULT 'da_fare' CHECK (stato IN ('da_fare', 'fatto')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabella separata da leads: blocca anche indirizzi mai caricati come lead
-- (es. qualcuno scrive direttamente chiedendo di non essere ricontattato).
CREATE TABLE esclusioni (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  motivo TEXT
);

-- Sostituisce l'idea originale "gruppi_outlook_sync" (legata a Microsoft Graph, non
-- disponibile su casella Aruba/IMAP). Soluzione provvisoria: export CSV/vCard per
-- import manuale in Outlook — vedi requisito funzionale #8 nella spec.
CREATE TABLE gruppi_export_richiamo (
  id SERIAL PRIMARY KEY,
  citta TEXT,
  regione TEXT,
  formato TEXT NOT NULL DEFAULT 'csv' CHECK (formato IN ('csv', 'vcard')),
  data_ultimo_export TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==== Indici (sezione "Anti-intasamento" della spec) ====
CREATE UNIQUE INDEX idx_leads_email ON leads(email);
CREATE UNIQUE INDEX idx_esclusioni_email ON esclusioni(email);
CREATE INDEX idx_leads_stato ON leads(stato);
CREATE INDEX idx_email_events_lead_data ON email_events(lead_id, data);

-- Un messaggio inviato a più destinatari genera più righe (una per lead): la
-- chiave di deduplicazione è quindi la coppia (message_id, lead_id), non
-- message_id da solo. Permette al job di polling di girare ripetutamente
-- senza duplicare eventi già loggati (ON CONFLICT DO NOTHING).
CREATE UNIQUE INDEX idx_email_events_message_lead ON email_events(message_id, lead_id);

-- Nota: l'archiviazione periodica degli eventi più vecchi di ~12 mesi su lead
-- chiusi/esclusi (in tabella di archivio separata) è prevista dalla spec ma non
-- ancora implementata qui — vedi checklist punto 10.
