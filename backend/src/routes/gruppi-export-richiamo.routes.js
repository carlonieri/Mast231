const express = require('express');

const { generaRichiamoZona, listRichiamiZona } = require('../services/richiamo-zona.service');

const router = express.Router();

// Storico delle generazioni di bozze richiamo per zona
router.get('/', async (req, res) => {
  try {
    const storico = await listRichiamiZona();
    res.json(storico);
  } catch (err) {
    console.error('Errore nel recuperare lo storico richiami per zona:', err);
    res.status(500).json({ message: 'Errore nel recuperare lo storico richiami per zona.' });
  }
});

// Genera una bozza (o più, scaglionate) con i contatti "senza risposta" della
// zona in CCN — vedi spec, requisito funzionale #8.
router.post('/', async (req, res) => {
  try {
    const { citta, regione } = req.body || {};
    const risultato = await generaRichiamoZona({ citta, regione });
    res.status(201).json(risultato);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    console.error('Errore nel generare il richiamo per zona:', err);
    return res.status(500).json({ message: 'Errore nel generare il richiamo per zona.' });
  }
});

module.exports = router;
