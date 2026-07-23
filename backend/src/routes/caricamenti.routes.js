const express = require('express');
const multer = require('multer');

const { getPool } = require('../config/db');
const { processUpload } = require('../services/caricamento.service');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Storico dei caricamenti (import batch di contatti)
router.get('/', async (req, res) => {
  try {
    const result = await getPool().query(
      `SELECT id, fonte, citta, regione, numero_record, caricato_da, dettagli, data_caricamento
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

// Carica lista giornaliera: valida, deduplica, controlla la blacklist e
// genera una bozza IMAP (destinatari precompilati) ogni 150 indirizzi puliti.
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

module.exports = router;
