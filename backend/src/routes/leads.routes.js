const express = require('express');

const router = express.Router();

// Lista lead, filtrabile per stato/citta/regione (le 5 sezioni del gestionale)
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Non ancora implementato' });
});

// Dettaglio lead: storico email + avviso anti-duplicazione
router.get('/:id', (req, res) => {
  res.status(501).json({ message: 'Non ancora implementato' });
});

// Aggiorna stato lead (es. dopo classificazione di una risposta)
router.patch('/:id', (req, res) => {
  res.status(501).json({ message: 'Non ancora implementato' });
});

module.exports = router;
