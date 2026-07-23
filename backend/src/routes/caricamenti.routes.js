const express = require('express');

const router = express.Router();

// Storico dei caricamenti (import batch di contatti)
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Non ancora implementato' });
});

// Registra un nuovo caricamento di contatti
router.post('/', (req, res) => {
  res.status(501).json({ message: 'Non ancora implementato' });
});

module.exports = router;
