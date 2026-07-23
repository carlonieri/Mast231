# Mast231 — Gestionale di tracciamento email (invio manuale via Outlook)

> **Nota di correzione (post-brief iniziale)**: la casella email del cliente è ospitata
> su **Aruba nativo** (confermato dai record DNS del dominio), **non su Microsoft 365**.
> Il collegamento per leggere Posta Inviata/Arrivo è quindi **IMAP standard**
> (host/porta/utente/password), non Microsoft Graph/Azure AD/OAuth. Questo documento
> è stato aggiornato di conseguenza rispetto al brief originale.

## 0. Contesto (leggi prima di scrivere codice)

Mast Srls è una società di consulenza compliance (antiriciclaggio D.Lgs 231/2007, GDPR, D.Lgs 231/2001, whistleblowing) rivolta a commercialisti/avvocati/notai/consulenti del lavoro. Manda migliaia di email al mese, città per città, in tutta Italia.

**Il piano precedente** (invio automatizzato via Smartlead + Claude) è stato scartato dal cliente dopo un confronto diretto. **Il nuovo scope è diverso e più ristretto**: il cliente vuole continuare a mandare le email A MANO da Outlook (selezione manuale indirizzi, stessa email a tutti), e vuole un gestionale che lavori "intorno" a questo flusso, non al posto suo.

## 1. Vincoli duri (non negoziabili)

- **Il sistema non deve mai inviare email in autonomia.** Nessuna automazione dell'invio, nessuna API key usata per mandare. L'unico canale di invio resta Outlook, azionato a mano dall'operatore.
- A livello tecnico: il collegamento alla casella email (ospitata su Aruba) avviene **solo via IMAP standard, in sola lettura**. Il sistema non ha e non deve mai avere credenziali SMTP configurate. Questo è un vincolo di sicurezza verificabile a livello strutturale (senza credenziali SMTP l'invio è fisicamente impossibile), non solo una policy applicativa.
- L'unica azione che il sistema può eseguire in autonomia (senza intervento umano) è: **cancellare i dati di un contatto che ha chiesto di essere rimosso**, quando la richiesta viene rilevata in una risposta.
- Per tutti gli altri casi (contatto interessato, es. richiesta preventivo) il sistema **prepara/categorizza**, ma è sempre una persona fisica a contattare.
- Il sistema deve essere sicuro (dati non persi, backup) ma leggero (non deve "intasarsi" con l'andare del tempo — serve strategia di indicizzazione/archiviazione).

## 2. Requisiti funzionali

1. **Log automatico delle email inviate**: leggere periodicamente la cartella "Posta Inviata" via IMAP, estrarre destinatario/i, data, oggetto, e categorizzare il contenuto (via Claude) per capire di cosa trattava l'invio.
2. **Anti-duplicazione**: prima che l'operatore selezioni di nuovo gli indirizzi in Outlook, il gestionale deve poter mostrare, per ogni contatto, l'ultima email ricevuta (data + categoria), per evitare di rimandare lo stesso contenuto a distanza di pochi giorni. È un avviso/consultazione, non un blocco tecnico (il sistema non può impedire l'invio da Outlook).
3. **Rilevamento risposte**: leggere periodicamente la "Posta in Arrivo" via IMAP, individuare le risposte collegate ai contatti tracciati.
4. **Classificazione automatica delle risposte** (via Claude): interessato / non interessato / richiesta di rimozione / ambiguo.
5. **Routing in base alla classificazione**:
   - Interessato (es. richiede preventivo) → entra nella sezione/categoria giusta, task assegnato a una persona fisica. Nessuna risposta automatica.
   - Richiesta di rimozione → il sistema cancella autonomamente i dati del contatto e lo segna come "da non contattare mai più".
   - Nessuna risposta dopo N giorni configurabili → il contatto finisce nella sezione "clienti contattati senza risposta", con una data di richiamo suggerita. Il sistema pianifica, non invia: il richiamo resta un'azione manuale da evadere.
6. **Sezioni del gestionale**: clienti già acquisiti, clienti in acquisizione, clienti potenziali/interessati, clienti contattati senza risposta, esclusi/rimossi.
7. **Suddivisione per città/regione**: i contatti vengono inviati già oggi organizzati per città/regione (vedi nota tecnica sotto per le ipotesi sul perché). Ogni sezione del gestionale (punto 6) deve poter essere filtrata/vista anche per città e per regione, non solo come lista unica — è la stessa logica di organizzazione che usano già loro, portata dentro il gestionale.
8. **Velocizzare il richiamo di "chi non ha risposto" (senza automatizzare invio o testo)**: l'idea originale era sincronizzare in automatico, via Microsoft Graph, un Gruppo Contatti in Outlook per ogni città/regione con i contatti attualmente in stato "senza risposta" (es. "Da richiamare — Firenze"). **Questo meccanismo dipende da Microsoft Graph e presuppone una casella Microsoft 365/Outlook.com: non è utilizzabile così com'è con una casella Aruba/IMAP**, perché IMAP non espone contatti né gruppi (è un protocollo solo email). **Da validare con il cliente/team una soluzione alternativa**, ad esempio: il gestionale genera un file esportabile (CSV o vCard) con i contatti "senza risposta" per città/regione, che l'operatore importa a mano in Outlook come gruppo/lista di distribuzione. Il principio del vincolo resta identico: il sistema non scrive né manda nulla, automatizza solo la preparazione dell'elenco destinatari.
9. **Analisi/dashboard**: andamento mese su mese (email tracciate, risposte, tasso di risposta, interessati, opt-out), utile come strumento decisionale per il cliente.
10. **Interfaccia**: web app con login, non un software da installare sui pc del cliente.

**Nota tecnica sui limiti di invio**: l'ipotesi iniziale era che il cliente inviasse a blocchi per città/regione per restare sotto i limiti di Microsoft 365/Exchange Online (max 500 destinatari/messaggio, 10.000/giorno, 1.000/giorno verso contatti mai scritti prima). Dato che la casella è su Aruba e non su Microsoft 365, questi limiti specifici **non si applicano** — **da verificare con il cliente** se Aruba impone limiti propri di invio giornaliero/destinatari, oppure se la suddivisione per città/regione è puramente organizzativa (gestione più semplice delle campagne, non un vincolo tecnico).

## 3. Architettura proposta

**Stack**: Node.js + Express + PostgreSQL + Claude API (classificazione testo) + IMAP (lettura mailbox Aruba, in sola lettura, tramite polling periodico).

**Tabelle DB (indicative)**:
- `leads`: contatto, città, regione, stato (da_contattare / contattato / interessato / non_interessato / senza_risposta / escluso), ultima_categoria_email, ultima_data_contatto
- `email_events`: id, lead_id, direzione (inviata/ricevuta), data, oggetto, categoria (assegnata da Claude), fonte (sent_items/inbox)
- `follow_up`: lead_id, data_suggerita, motivo, stato (da_fare/fatto)
- `esclusioni`: email, data, motivo — tabella separata da leads, così blocca anche indirizzi mai caricati come lead, se qualcuno scrive direttamente chiedendo di non essere ricontattato
- `gruppi_export_richiamo`: città/regione, data_ultimo_export, formato (CSV/vCard) — tabella indicativa e provvisoria, da rivedere insieme alla soluzione scelta per il punto 8 (sostituisce l'idea originale di `gruppi_outlook_sync` legata a Microsoft Graph)

**Anti-intasamento**: indici su email (leads, esclusioni), su stato lead, su lead_id+data (email_events); archiviazione periodica degli eventi più vecchi di ~12 mesi su lead ormai chiusi/esclusi, in tabella di archivio separata.

**Sicurezza**: credenziali IMAP (in particolare la password) salvate in modo sicuro e cifrato, mai in chiaro nel codice o versionate; connessione DB autenticata e cifrata in transito; backup schedulati.

## 4. Checklist di implementazione (ordine consigliato)

1. Setup connessione IMAP alla casella Aruba (host, porta, utente, password gestita in modo sicuro/cifrato), in sola lettura. Nessuna credenziale SMTP configurata nel sistema: MAI la possibilità tecnica di inviare email.
2. Schema Postgres: leads, email_events, follow_up, esclusioni + indici.
3. Job di polling periodico su Posta Inviata via IMAP → log automatico + categorizzazione via Claude.
4. Job di polling periodico su Posta in Arrivo via IMAP → rilevamento risposte collegate ai lead.
5. Classificazione risposte via Claude (interessato/non interessato/rimozione/ambiguo).
6. Routing: cancellazione automatica dati su richiesta di rimozione; creazione task per interessati; passaggio a "senza risposta" + data di richiamo suggerita per chi non risponde entro N giorni.
7. Web app (frontend) con login: le 5 sezioni (acquisiti, in acquisizione, potenziali/interessati, senza risposta, esclusi), ciascuna filtrabile per città e per regione, + vista dettaglio contatto con storico email + avviso anti-duplicazione.
8. Soluzione per velocizzare il richiamo di "chi non ha risposto" per città/regione — **da validare** (vedi punto 8 dei requisiti funzionali): probabile export CSV/vCard per import manuale in Outlook, in alternativa alla sincronizzazione automatica via Graph (non disponibile su casella Aruba/IMAP).
9. Dashboard analisi mensile (email tracciate, risposte, tasso risposta, interessati, opt-out).
10. Strategia di backup e archiviazione dati vecchi.

---
*Documento preparato come brief compresso per l'implementazione con Claude Code. Sostituisce, per la parte di invio, il piano precedente basato su Smartlead: l'invio resta manuale via Outlook, il sistema si occupa solo di tracciamento, classificazione e organizzazione. Aggiornato per riflettere la casella email ospitata su Aruba (IMAP), non Microsoft 365 (Graph/Azure AD).*
