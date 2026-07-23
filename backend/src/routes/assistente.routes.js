const express = require('express');

const { rispondiDomandaAssistenza } = require('../services/assistente.service');

const router = express.Router();

// Chat dell'assistente in-app: risponde a domande su come usare il
// gestionale, non esegue azioni. Nessuna persistenza lato server — il
// frontend invia l'intera cronologia della conversazione a ogni richiesta.
router.post('/chat', async (req, res) => {
  try {
    const testo = await rispondiDomandaAssistenza(req.body.messaggi);
    res.json({ testo });
  } catch (err) {
    if (err.statusCode === 400) return res.status(400).json({ message: err.message });
    console.error('Errore nella chat di assistenza:', err);
    return res.status(500).json({ message: 'Errore nel generare la risposta.' });
  }
});

module.exports = router;
