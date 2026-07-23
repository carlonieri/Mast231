const express = require('express');

const router = express.Router();

// Stato degli export per città/regione (contatti "senza risposta")
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Non ancora implementato' });
});

// Genera un nuovo export CSV/vCard per una città/regione (vedi spec, requisito #8)
router.post('/:zona/export', (req, res) => {
  res.status(501).json({ message: 'Non ancora implementato' });
});

module.exports = router;
