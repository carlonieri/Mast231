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

> Stato attuale: solo impalcatura iniziale (struttura cartelle, dipendenze base,
> server Express che risponde su `/health`, app React vuota). Nessuna funzionalità
> di business è ancora implementata.

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
npm run dev
```

Il server parte su `http://localhost:3000` (configurabile via `PORT` in `.env`).
Verifica che sia su con:

```bash
curl http://localhost:3000/health
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

## Setup — Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

L'app parte su `http://localhost:5173`.

## Variabili d'ambiente

Ogni sottoprogetto ha il proprio `.env.example` da copiare in `.env` (mai committare `.env`).

- `backend/.env.example`: connessione al database Postgres, chiave Claude API,
  credenziali IMAP della casella email (Aruba), secret di sessione.
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
