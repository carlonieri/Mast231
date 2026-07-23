const express = require('express');

const router = express.Router();

// Lista indirizzi esclusi/rimossi
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Non ancora implementato' });
});

// Aggiunge un'esclusione (es. richiesta di rimozione rilevata in una risposta)
router.post('/', (req, res) => {
  res.status(501).json({ message: 'Non ancora implementato' });
});

module.exports = router;
