const express = require('express');

const router = express.Router();

// Lista dei richiami suggeriti (da_fare / fatto)
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Non ancora implementato' });
});

// Segna un richiamo come evaso
router.patch('/:id', (req, res) => {
  res.status(501).json({ message: 'Non ancora implementato' });
});

module.exports = router;
