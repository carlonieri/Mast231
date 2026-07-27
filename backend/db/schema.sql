-- Mast231 — schema Postgres iniziale
-- Vedi docs/mast231_gestionale_spec.md sezione 3 ("Architettura proposta") per il contesto.
-- Solo struttura: nessuna funzionalità applicativa è ancora collegata a queste tabelle.

-- Account per il login (titolare + operatori). Password sempre come hash
-- (bcrypt), mai in chiaro. 'attivo' disattiva l'accesso senza cancellare
-- l'account: preserva lo storico (follow_up.assegnato_a) e la possibilità di
-- riattivarlo, invece di una DELETE distruttiva.
CREATE TABLE utenti (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  ruolo TEXT NOT NULL DEFAULT 'operatore' CHECK (ruolo IN ('titolare', 'operatore')),
  attivo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_utenti_email ON utenti(email);

CREATE TABLE caricamenti (
  id SERIAL PRIMARY KEY,
  fonte TEXT,                    -- es. nome file importato
  citta TEXT,
  regione TEXT,
  numero_record INTEGER,
  caricato_da TEXT,              -- operatore che ha effettuato il caricamento
  note TEXT,
  -- 'in_revisione': ci sono indirizzi segnalati (lead già acquisiti/interessati/
  -- non interessati/contattati di recente) in attesa che l'operatore decida,
  -- indirizzo per indirizzo, se tenerli o escluderli — nessun lead viene
  -- creato/aggiornato né bozza generata finché non si conferma (vedi
  -- caricamento.service.js). 'completato': caricamento finalizzato.
  stato TEXT NOT NULL DEFAULT 'completato' CHECK (stato IN ('in_revisione', 'completato')),
  dettagli JSONB,                -- riepilogo strutturato: validazione, dedup, blacklist, revisione, bozze generate
  -- Righe pulite automatiche e segnalate, salvate qui SOLO mentre stato =
  -- 'in_revisione', per poter finalizzare il caricamento (POST .../conferma)
  -- senza richiedere di ricaricare il file una seconda volta. Azzerato alla
  -- finalizzazione: non deve mai comparire nello storico esposto al frontend.
  revisione_pendente JSONB,
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
  -- NULL = non assegnato. Creato sempre NULL (i task nascono da job
  -- automatici, senza un operatore loggato al momento della creazione):
  -- un operatore lo prende in carico da Richiami, assegnandolo a se stesso.
  assegnato_a INTEGER REFERENCES utenti(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_follow_up_assegnato_a ON follow_up(assegnato_a);

-- Tabella separata da leads: blocca anche indirizzi mai caricati come lead
-- (es. qualcuno scrive direttamente chiedendo di non essere ricontattato).
CREATE TABLE esclusioni (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  motivo TEXT
);

-- Sostituisce l'idea originale "gruppi_outlook_sync" (legata a Microsoft Graph,
-- non disponibile su casella Aruba/IMAP) — vedi requisito funzionale #8 nella
-- spec. Soluzione scelta (non un export CSV/vCard separato): riusa lo stesso
-- meccanismo di imap-draft.service.js già collegato a "Carica lista
-- giornaliera" — genera una bozza reale con i contatti "senza risposta" della
-- zona scelta in CCN (stesso scaglionamento oltre soglia). Una riga per ogni
-- generazione (log, non un record da aggiornare).
CREATE TABLE gruppi_export_richiamo (
  id SERIAL PRIMARY KEY,
  citta TEXT,
  regione TEXT,
  numero_destinatari INTEGER NOT NULL,
  numero_bozze INTEGER NOT NULL,
  data_generazione TIMESTAMPTZ NOT NULL DEFAULT now()
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

-- Traccia le richieste di categorizzazione delle email inviate inoltrate alla
-- Batch API di Claude (non urgente: ~50% di risparmio rispetto alla chiamata
-- in tempo reale). La classificazione delle risposte resta invece in tempo
-- reale — non passa da questa tabella. Pipeline a due fasi:
-- submit-sent-email-batch.job.js inserisce una riga per ogni messaggio
-- inviato alla Batch API; apply-sent-email-batch.job.js la aggiorna quando
-- il risultato è pronto (i batch possono richiedere fino a 24 ore).
CREATE TABLE categorizzazioni_batch (
  id SERIAL PRIMARY KEY,
  custom_id TEXT NOT NULL,       -- custom_id della richiesta nel batch Claude
  batch_id TEXT NOT NULL,        -- id del batch Claude (msgbatch_...)
  message_id TEXT NOT NULL,      -- Message-ID IMAP del messaggio da categorizzare
  stato TEXT NOT NULL DEFAULT 'in_attesa' CHECK (stato IN ('in_attesa', 'completato', 'errore')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completato_il TIMESTAMPTZ
);
CREATE UNIQUE INDEX idx_categorizzazioni_batch_custom_id ON categorizzazioni_batch(custom_id);
CREATE INDEX idx_categorizzazioni_batch_stato ON categorizzazioni_batch(stato);
CREATE INDEX idx_categorizzazioni_batch_message_id ON categorizzazioni_batch(message_id);

-- Nota: l'archiviazione periodica degli eventi più vecchi di ~12 mesi su lead
-- chiusi/esclusi (in tabella di archivio separata) è prevista dalla spec ma non
-- ancora implementata qui — vedi checklist punto 10.
