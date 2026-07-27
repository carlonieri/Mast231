const express = require('express');
const multer = require('multer');

const { getPool } = require('../config/db');
const { processUpload, confermaRevisione } = require('../services/caricamento.service');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Storico dei caricamenti (import batch di contatti). 'revisione_pendente' è
// intenzionalmente escluso: è uno stato interno, non uno storico da mostrare.
router.get('/', async (req, res) => {
  try {
    const result = await getPool().query(
      `SELECT id, fonte, citta, regione, numero_record, caricato_da, stato, dettagli, data_caricamento
       FROM caricamenti
       ORDER BY data_caricamento DESC
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Errore nel recuperare lo storico caricamenti:', err);
    res.status(500).json({ message: 'Errore nel recuperare lo storico caricamenti.' });
  }
});

// Carica lista giornaliera: valida, deduplica e controlla la blacklist
// (automatici, senza eccezioni). Gli indirizzi che corrispondono a lead già
// acquisiti/interessati/non interessati/contattati di recente non vengono
// inclusi né scartati in automatico: la risposta torna con stato
// 'in_revisione' e l'elenco da confermare (vedi POST /:id/conferma). Se non
// ce n'è nessuno, il caricamento si finalizza subito (stato 'completato') e
// genera già le bozze IMAP scaglionate.
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Nessun file caricato (campo "file" mancante).' });
  }

  try {
    const risultato = await processUpload({
      buffer: req.file.buffer,
      fonte: req.file.originalname,
      citta: req.body.citta,
      regione: req.body.regione,
      caricatoDa: req.body.caricato_da,
    });
    res.status(201).json(risultato);
  } catch (err) {
    if (err.message.includes('non supportato') || err.message.includes('non riconosciuto')) {
      return res.status(400).json({ message: err.message });
    }
    console.error('Errore nel processare il caricamento:', err);
    return res.status(500).json({ message: 'Errore nel processare il caricamento.' });
  }
});

// Recupera un caricamento 'in_revisione' (per riprendere la revisione dopo un
// refresh della pagina o da un altro operatore/dispositivo): stessa forma
// della risposta di POST / quando ci sono indirizzi da segnalare.
router.get('/:id/revisione', async (req, res) => {
  try {
    const result = await getPool().query('SELECT id, stato, dettagli FROM caricamenti WHERE id = $1', [req.params.id]);
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ message: 'Caricamento non trovato.' });
    }
    if (row.stato !== 'in_revisione') {
      return res.status(409).json({ message: 'Questo caricamento non è (più) in attesa di revisione.' });
    }
    res.json({ caricamento_id: row.id, ...row.dettagli });
  } catch (err) {
    console.error('Errore nel recuperare la revisione del caricamento:', err);
    res.status(500).json({ message: 'Errore nel recuperare la revisione del caricamento.' });
  }
});

// Conferma la revisione manuale di un caricamento 'in_revisione': richiede una
// decisione ('tieni' o 'escludi') per ciascun indirizzo segnalato. Solo da qui
// vengono creati/aggiornati i lead e generate le bozze IMAP.
router.post('/:id/conferma', async (req, res) => {
  const { decisioni } = req.body || {};
  if (!Array.isArray(decisioni)) {
    return res.status(400).json({ message: 'Il campo "decisioni" deve essere un array di { email, azione }.' });
  }

  try {
    const risultato = await confermaRevisione({ caricamentoId: Number(req.params.id), decisioni });
    res.json(risultato);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    console.error('Errore nel confermare la revisione del caricamento:', err);
    return res.status(500).json({ message: 'Errore nel confermare la revisione del caricamento.' });
  }
});

module.exports = router;
