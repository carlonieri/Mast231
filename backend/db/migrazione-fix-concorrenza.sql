-- Migrazione per database già creati con lo schema precedente: allinea i
-- vincoli a quelli in schema.sql dopo il fix di alcune race condition nei
-- job periodici (caricamento liste, log email inviate, richiami senza
-- risposta). Su un database nuovo non serve: schema.sql è già aggiornato.
--
-- Eseguire una sola volta: psql -U <utente> -d <db> -f db/migrazione-fix-concorrenza.sql

ALTER TABLE caricamenti DROP CONSTRAINT IF EXISTS caricamenti_stato_check;
ALTER TABLE caricamenti ADD CONSTRAINT caricamenti_stato_check
  CHECK (stato IN ('in_elaborazione', 'in_revisione', 'completato', 'errore'));

ALTER TABLE categorizzazioni_batch ALTER COLUMN batch_id DROP NOT NULL;

-- Se il database ha già righe duplicate per lo stesso message_id (causate
-- proprio dal bug che questa migrazione risolve), la CREATE UNIQUE INDEX
-- sotto fallisce: in quel caso vanno prima ripulite manualmente le righe
-- duplicate più vecchie (tenendo la più recente) prima di rieseguire.
DROP INDEX IF EXISTS idx_categorizzazioni_batch_message_id;
CREATE UNIQUE INDEX idx_categorizzazioni_batch_message_id ON categorizzazioni_batch(message_id);
