# Mast231 — Gestionale di tracciamento email

Gestionale interno per tracciare le email inviate a mano via Outlook da Mast Srls,
rilevare le risposte e classificarle. **Il sistema non invia mai email in autonomia**:
l'unico canale di invio resta Outlook, azionato a mano dall'operatore.

La specifica completa del progetto è in [`docs/mast231_gestionale_spec.md`](docs/mast231_gestionale_spec.md).
Leggerla prima di iniziare a scrivere codice: contiene i vincoli non negoziabili
(in particolare: nessuna credenziale SMTP, il sistema si collega alla casella email
solo in lettura via IMAP).

> **Nota**: la casella email del cliente è ospitata su Aruba (hosting nativo), **non**
> su Microsoft 365. Il collegamento è IMAP standard, non Microsoft Graph/OAuth — la
> spec originale conteneva ancora riferimenti a Graph/Azure AD, superati da questa
> correzione.

> Stato attuale: tutte le funzionalità principali sono implementate (tracciamento
> invii/risposte, routing, dashboard, carica lista, richiamo per zona, assistente,
> login). Restano aperti: scheduling automatico dei job periodici, archiviazione/
> backup dati.

## Struttura del repository

Monorepo con un solo git alla radice, due sottoprogetti indipendenti (ognuno con il proprio `package.json`):

```
Mast231/
├── backend/     Node.js + Express + PostgreSQL + Claude API + IMAP (Aruba)
├── frontend/    React + Vite (web app con login)
└── docs/        Specifica di progetto
```

## Per chi lavora sul team (1 frontend, 2 backend)

- **Backend (2 persone)**: lavorate dentro `backend/`. Coordinatevi su chi tocca
  cosa tra i job di polling IMAP, la classificazione via Claude e lo schema DB,
  per evitare di pestarvi i piedi sugli stessi file.
- **Frontend (1 persona)**: lavorate dentro `frontend/`. Il backend espone (o esporrà)
  le API su `http://localhost:3000`; l'URL è configurabile via `VITE_API_BASE_URL`
  in `frontend/.env`.
- Un solo repo git condiviso: aprite branch per feature (es. `backend/imap-polling`,
  `frontend/login-page`) e pull request verso `main`.

## Prerequisiti

- Node.js 20+ e npm
- PostgreSQL 14+ (locale o remoto)
- Credenziali IMAP della casella email del cliente (host, porta, utente, password) — casella ospitata su Aruba
- Una chiave API Claude (Anthropic)
- Git

## Setup — Backend

```bash
cd backend
npm install
cp .env.example .env
# compila .env con le tue credenziali (vedi sezione "Variabili d'ambiente" sotto)
# applica lo schema su un Postgres già creato: psql -U <utente> -d <db> -f db/schema.sql
npm run dev
```

Il server parte su `http://localhost:3000` (configurabile via `PORT` in `.env`).
Verifica che sia su con:

```bash
curl http://localhost:3000/health
```

Su un database appena creato non esiste ancora nessun account: crea il primo
(titolare) da riga di comando, poi accedi al gestionale e crea gli altri da
"Gestione utenti" (vedi sezione "Login e gestione utenti" sotto):

```bash
npm run utenti:crea-primo -- "Nome Cognome" email@esempio.it password
```

### Testare il collegamento IMAP senza toccare la casella del cliente

Per sviluppare/testare in locale la lettura di Posta Inviata/Arrivo senza usare le
credenziali reali di Aruba, il backend include due script che lavorano su una casella
di test usa-e-getta (Ethereal, servizio pubblico per test — non consegna email reali):

```bash
npm run imap:seed   # crea una casella di test e la popola con alcune email finte
# copia le credenziali stampate in output dentro backend/.env
npm run imap:read   # legge Posta Inviata e Posta in Arrivo e stampa i risultati
```

### Log automatico delle email inviate + categorizzazione via Claude (Batch API)

Pipeline a due fasi. La categorizzazione delle email inviate non è urgente (a
differenza della classificazione delle risposte, sotto, che resta in tempo
reale) e passa dalla **Batch API** di Claude — ~50% più economica di una
chiamata diretta — come ottimizzazione di costo.

```bash
npm run job:submit-sent-batch   # fase 1: legge Posta Inviata, registra subito
                                 # lead+email_events (categoria in attesa) e invia
                                 # le email nuove alla Batch API
npm run job:apply-sent-batch    # fase 2: controlla i batch in attesa e applica la
                                 # categoria quando pronta (fino a 24 ore) — rieseguire
                                 # periodicamente finché non risulta più nulla "in corso"
```

Entrambi rieseguibili senza duplicare eventi o reinviare messaggi già in coda.

### Rilevamento risposte + classificazione via Claude

Legge "Posta in Arrivo" via IMAP, correla ogni messaggio a un lead tracciato,
riconosce bounce (mancato recapito) e risposte automatiche di assenza — non
sono vere risposte, quindi non toccano lo stato del lead — e classifica le
risposte umane con Claude in interessato / non interessato / rimozione /
ambiguo, applicando il routing corrispondente (per "rimozione", l'unica azione
autonoma prevista dalla spec: il lead viene cancellato e l'indirizzo escluso
in modo permanente). Se "interessato", crea un task da evadere in `follow_up`,
non assegnato a nessuno (il job gira in background, senza un operatore
collegato): un operatore lo prende in carico da "Richiami" assegnandoselo.
Nella stessa chiamata a Claude che classifica la risposta, viene generata
anche una **sintesi in una riga** del contenuto concreto (es. "Chiede un
preventivo per 3 sedi entro fine mese"), salvata in `email_events.sintesi` e
mostrata nella timeline del dettaglio contatto — non solo l'etichetta di
classificazione. Nessuna sintesi per bounce/risposte automatiche (Claude non
viene interpellato in quei casi). Rieseguibile senza duplicare eventi già
loggati.

```bash
npm run job:log-replies
```

### Lead senza risposta (richiamo suggerito)

Job separato e indipendente dalla classificazione delle risposte, da eseguire
periodicamente (es. una volta al giorno): sposta in "senza risposta" i lead
`contattato` la cui ultima email risale a più di `FOLLOWUP_DAYS_THRESHOLD`
giorni fa (default 7, configurabile in `.env`) e crea un task di richiamo in
`follow_up`. Non invia nulla: il richiamo resta un'azione manuale. Idempotente.

```bash
npm run job:flag-no-response
```

### Carica lista giornaliera

`POST /api/caricamenti` (multipart/form-data, campo `file`: .xlsx o .csv, campi
opzionali `citta`/`regione` come default per le righe senza quei valori). Valida
ogni riga (solo email obbligatoria) e deduplica gli indirizzi ripetuti nel file
(non è una questione di giudizio, solo un errore di dati: resta un controllo
automatico). Controlla poi ognuno contro la blacklist (`esclusioni`) — l'unica
esclusione automatica senza eccezioni, per motivi legali/privacy.

Per tutti gli altri casi il sistema non decide da solo: un indirizzo che
corrisponde a un lead già `acquisito`, `interessato`, `non_interessato` o
`contattato` di recente (entro `FOLLOWUP_DAYS_THRESHOLD` giorni) non viene né
incluso né scartato in automatico, ma segnalato per revisione manuale
(`stato: 'in_revisione'` nella risposta, con l'elenco `segnalati`: email, stato
attuale, da quanto tempo, motivo). Se non c'è nulla da segnalare, il
caricamento si finalizza subito come prima. Altrimenti l'operatore conferma con
`POST /api/caricamenti/:id/conferma` (`{ decisioni: [{ email, azione: 'tieni'
| 'escludi' }, ...] }`, una voce per ogni indirizzo segnalato): solo a quel
punto vengono creati/aggiornati i lead della lista finale (puliti automatici +
confermati) e generate le bozze. `caricamenti.dettagli` registra il riepilogo
completo con conteggi distinti: righe totali, non valide, duplicati nel file,
esclusi per blacklist, puliti automatici, segnalati per revisione (con quanti
tenuti e quanti esclusi dall'operatore). Ogni 150 destinatari della lista
finale (configurabile via `UPLOAD_BATCH_SIZE`) genera automaticamente una bozza
email reale nella cartella Bozze della casella (via IMAP, unica scrittura del
progetto oltre alla lettura — mai un invio) con i destinatari già inseriti nel
campo A: oggetto e corpo restano vuoti, il testo resta sempre dell'operatore.
`GET /api/caricamenti` restituisce lo storico degli ultimi caricamenti (incluso
lo stato `in_revisione`/`completato`). Se una revisione resta interrotta (es.
refresh della pagina prima di confermare, o da un altro operatore/dispositivo),
`GET /api/caricamenti/:id/revisione` la recupera (stessa forma della risposta
di POST /, 404 se l'id non esiste, 409 se non è più in attesa di revisione) —
nel frontend, "Riprendi" nella tabella storico.

### Richiamo "senza risposta" per zona

Requisito funzionale #8. L'idea originale (sincronizzare un Gruppo Contatti
Outlook via Microsoft Graph) non è utilizzabile su una casella Aruba/IMAP;
invece di un export CSV/vCard separato da importare a mano, **riusa lo stesso
meccanismo di "Carica lista giornaliera"**: `POST /api/gruppi-export-richiamo`
(`{ citta, regione }`, almeno uno dei due obbligatorio) genera una bozza email
reale in Bozze con i contatti in stato `senza_risposta` di quella zona — non
in "A" ma in **CCN**, perché non devono vedersi tra loro — con lo stesso
scaglionamento oltre soglia (`UPLOAD_BATCH_SIZE`) di "Carica lista
giornaliera". Il sistema prepara solo i destinatari: oggetto e testo restano
sempre dell'operatore, nessun invio automatico. Collegato nel frontend nella
sezione "Senza risposta": genera per la città/regione attualmente filtrata.
`GET /api/gruppi-export-richiamo` restituisce lo storico delle generazioni.

### Assistente in-app

`POST /api/assistente/chat` (`{ messaggi: [{ ruolo: 'operatore'|'assistente', testo }] }`,
nessuna persistenza lato server: il frontend invia l'intera cronologia a ogni
richiesta) risponde a domande su come usare il gestionale (dove trovo X, come
faccio Y). Non esegue azioni al posto dell'operatore, né nell'app né su
Outlook: nessun tool a disposizione, solo testo. Widget di chat sempre visibile
in basso a destra in ogni pagina del frontend.

### Login e gestione utenti

Autenticazione a sessione (cookie `httpOnly`, firmato con `SESSION_SECRET`),
non a token: più semplice per un gestionale interno a pochi utenti, senza
bisogno di gestire refresh-token lato frontend. Le sessioni sono salvate su
Postgres (`connect-pg-simple`, tabella creata automaticamente al primo avvio)
così sopravvivono ai riavvii del server — l'unica eccezione è la modalità
demo, che usa lo store in memoria di default (si azzera comunque ad ogni
riavvio, coerente con tutto il resto della demo).

Ogni account (`utenti`: nome, email, password con hash bcrypt, ruolo
`titolare`/`operatore`) è personale — niente credenziali condivise. Il primo
account (titolare) si crea da riga di comando (`npm run utenti:crea-primo`,
vedi sopra); tutti i successivi si creano dalla pagina **"Gestione utenti"**
nel frontend (`/utenti`, visibile solo al titolare in navigazione — e
comunque protetta anche lato server: un operatore che chiama direttamente
`/api/utenti` riceve 403). Da lì il titolare può anche disattivare un account
(blocca l'accesso senza cancellarlo, per non perdere lo storico dei task già
presi in carico) o reimpostare una password dimenticata — non esiste un
flusso di recupero autonomo via email.

`POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`. Tutte le
altre route `/api/*` richiedono una sessione valida (401 altrimenti).

**Assegnazione dei task "interessato"**: quando un lead risponde in modo
interessato, il task in `follow_up` nasce sempre non assegnato (è
`log-inbox-replies.job.js`, un job schedulato, a crearlo — nessun operatore è
"loggato" in quel momento). Un operatore lo assegna a se stesso con "Prendi in
carico" nella pagina Richiami (`PATCH /api/follow-up/:id/prendi-in-carico`,
usa l'utente della sessione corrente) — solo auto-assegnazione, nessuna
riassegnazione ad altri.

### Percorso stato (storico transizioni)

`leads.stato`/`updated_at` tengono solo il valore attuale: non bastano per
ricostruire QUANDO un contatto è passato da uno stato all'altro (serve al
percorso a stepper nel dettaglio contatto, vedi sopra). La tabella
`lead_stato_storico` registra un record per ogni transizione reale, con la
data vera del passaggio — mai indovinata: per le transizioni automatiche è la
data dell'email (invio/risposta) che l'ha causata, non la data in cui il job
è stato eseguito.

Un'unica funzione (`leads.service.js: registraCambioStato`) scrive in questa
tabella; ogni punto del codice che cambia `leads.stato` la richiama subito
dopo — `upsertLeadForSentEmail` (→ `contattato`), `upsertLeadFromUpload` (→
`da_contattare`, solo alla vera creazione del lead, mai su un ricaricamento),
`applyReplyClassification` (→ `interessato`/`non_interessato`),
`flag-no-response-leads.job.js` (→ `senza_risposta`), `updateLeadStato` (il
cambio manuale da dettaglio contatto, es. → `acquisito`, marcato `origine:
manuale`). Ignora silenziosamente le transizioni "a vuoto" (stesso stato
dell'ultima già registrata), così una seconda risposta "interessato" non
duplica la tappa.

## Setup — Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

L'app parte su `http://localhost:5173` e richiede il backend attivo su `http://localhost:3000`
(`VITE_API_BASE_URL` in `frontend/.env`).

### Sistema di design

Brand AnchorAI (azienda che ha sviluppato il gestionale per conto di Mast231 — il
nome "Mast231" resta il titolo del prodotto, invariato). Pensato per uno strumento
usato ore ogni giorno, non per una landing page: poche scelte, sempre uguali,
niente decorazioni. Tutti i token sono in `frontend/src/styles.css`.

- **Colore**: neutri antracite/bianco (`--text-primary`, `--surface-1`, ecc.) + un'unica
  famiglia di blu come accento (`--accent`/`--accent-light`/`--accent-dark`/`--accent-tint`),
  campionata dal logo e validata per contrasto — nessun altro colore decorativo. Il grafico
  dashboard usa la stessa rampa (3 tonalità di blu, ordinal single-hue). Rosso/ambra restano
  riservati a segnali funzionali (errori, badge critici/avviso) — mai usati come accento.
- **Tipografia**: due font self-hosted (`@fontsource`, nessuna richiesta a CDN esterni —
  coerente con un'app che tratta dati di compliance/GDPR). **IBM Plex Sans** (600/700) per
  titoli e intestazioni — `--font-heading`. **Public Sans** (400/500/600) per corpo del
  testo, tabelle e dati — `--font-body`, scelto per leggere molta informazione densa a lungo
  senza affaticare.
- **Forma**: scala di 3 raggi (`--radius-sm` 6px per controlli, `--radius-md` 10px per
  contenitori, `--radius-pill` per i soli badge di stato) e scala di 6 spaziature
  (`--space-1`…`--space-6`, 4→32px) — nessun valore "a occhio" nel resto del foglio di
  stile. Ombre riservate a ciò che galleggia sopra la pagina (il widget assistente): mai
  su card, tabelle o pulsanti.
- **Pulsanti**: gerarchia a tre livelli. `.btn-primario` (sfondo blu pieno) per l'unica
  azione principale di ogni schermata (Accedi, Carica, Crea account, Genera bozza
  richiamo…). `.btn-secondario` (bordo blu, sfondo trasparente) per azioni rilevanti ma
  non uniche — attualmente non in uso, disponibile per casi futuri. `.btn` semplice
  (bordo neutro) per azioni di contorno (Esporta Excel, Segna evaso, Disattiva…).
- **Stati di interazione**: bordo blu + alone leggero al focus su input/select (prima
  assente — affidato al default del browser), tinta blu leggera all'hover sulle righe
  delle tabelle, transizione di 120ms su hover/focus dei controlli.

### Sezioni del gestionale

- **Acquisiti / In acquisizione / Interessati / Senza risposta / Esclusi** — le 5 sezioni
  della spec (requisito #6), ciascuna filtrabile per città/regione (requisito #7) e con
  export Excel. Nota: `leads.stato` non ha una casella 1:1 per ognuna delle 5 sezioni —
  "In acquisizione" raggruppa `da_contattare`+`contattato`, "Acquisiti" usa un nuovo stato
  `acquisito` impostabile solo a mano (nessun segnale email lo rileva automaticamente),
  "Esclusi" legge dalla tabella `esclusioni` (i lead con richiesta di rimozione vengono
  cancellati, non marcati). Aggiunta anche una sesta vista **Non interessati**, non elencata
  esplicitamente tra le 5 ma necessaria per non nascondere quei contatti. In "Senza risposta"
  è presente anche il pulsante per generare la bozza di richiamo per la zona filtrata
  (requisito #8, vedi sopra).
- **Dettaglio contatto** (`/contatti/:id`) — in cima, un percorso a stepper orizzontale (es.
  "Da contattare (12/07) → Contattato (15/07) → Interessato (18/07) → Acquisito (22/07)")
  con le date REALI dei passaggi di questo contatto specifico, non solo lo stato attuale —
  vedi "Percorso stato" sotto. Poi: storico email completo, richiami collegati, avviso
  anti-duplicazione (requisito #2) se l'ultimo contatto risale a meno di 7 giorni, cambio
  stato manuale. La timeline dello storico email mostra, per ogni evento, il contenuto
  concreto e non solo l'etichetta: l'oggetto reale per le email inviate, la sintesi in una
  riga generata da Claude per le risposte ricevute (fallback all'oggetto grezzo per
  bounce/risposte automatiche, dove non c'è sintesi).
- **Dashboard** (`/dashboard`) — andamento mensile con grafico + tabella dati.
- **Richiami** (`/richiami`) — task da evadere (`follow_up`), con l'indicatore dei richiami
  del giorno sempre visibile nella barra di navigazione e l'assegnazione ("Prendi in carico")
  a chi è loggato.
- **Gestione utenti** (`/utenti`, solo titolare) — crea/disattiva account, resetta password.
- **Login** (`/login`) — tutte le rotte sopra richiedono una sessione valida, altrimenti
  si viene reindirizzati qui.

## Variabili d'ambiente

Ogni sottoprogetto ha il proprio `.env.example` da copiare in `.env` (mai committare `.env`).

- `backend/.env.example`: connessione al database Postgres, chiave Claude API,
  credenziali IMAP della casella email (Aruba), URL del frontend (per CORS con
  cookie di sessione — deve combaciare esattamente), secret di sessione.
- `frontend/.env.example`: URL base dell'API backend.

**Nota sulle credenziali email**: la casella del cliente è ospitata su Aruba (hosting
nativo, non Microsoft 365), quindi il collegamento per leggere Posta Inviata/Arrivo è
IMAP standard (host/porta/utente/password), non Microsoft Graph/OAuth. Il sistema si
collega **solo in lettura**: non vengono mai configurate credenziali SMTP, quindi non
può fisicamente inviare email — è un vincolo di sicurezza, non solo una policy
applicativa. In produzione la password IMAP va tenuta cifrata/in un secret manager,
mai in chiaro nel codice o versionata.

## Prossimi passi

Vedi la checklist di implementazione al punto 4 della [specifica](docs/mast231_gestionale_spec.md).
