const express = require('express');

const { getAndamentoMensile } = require('../services/dashboard.service');

const router = express.Router();

// Andamento mensile: email tracciate, risposte, tasso di risposta, interessati, opt-out
router.get('/', async (req, res) => {
  try {
    const andamentoMensile = await getAndamentoMensile();
    res.json({ andamento_mensile: andamentoMensile });
  } catch (err) {
    console.error('Errore nel calcolare la dashboard:', err);
    res.status(500).json({ message: 'Errore nel calcolare la dashboard.' });
  }
});

module.exports = router;
