const express = require('express');

const router = express.Router();

// Andamento mensile: email tracciate, risposte, tasso di risposta, interessati, opt-out
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Non ancora implementato' });
});

module.exports = router;
