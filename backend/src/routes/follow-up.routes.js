const express = require('express');

const { listFollowUp, markFollowUpDone, prendiInCarico } = require('../services/follow-up.service');

const router = express.Router();

// Lista dei richiami (default: da_fare). ?oggi=true filtra a scadenza oggi o
// già scaduti — usato per l'indicatore "richiami del giorno".
router.get('/', async (req, res) => {
  try {
    const richiami = await listFollowUp({
      stato: req.query.stato || 'da_fare',
      soloOggi: req.query.oggi === 'true',
    });
    res.json(richiami);
  } catch (err) {
    console.error('Errore nel recuperare i richiami:', err);
    res.status(500).json({ message: 'Errore nel recuperare i richiami.' });
  }
});

// Segna un richiamo come evaso (l'invio resta comunque manuale via Outlook)
router.patch('/:id', async (req, res) => {
  try {
    const richiamo = await markFollowUpDone(req.params.id);
    if (!richiamo) return res.status(404).json({ message: 'Richiamo non trovato.' });
    return res.json(richiamo);
  } catch (err) {
    console.error("Errore nell'aggiornare il richiamo:", err);
    return res.status(500).json({ message: "Errore nell'aggiornare il richiamo." });
  }
});

// L'operatore loggato prende in carico il richiamo (auto-assegnazione)
router.patch('/:id/prendi-in-carico', async (req, res) => {
  try {
    const richiamo = await prendiInCarico(req.params.id, req.utente.id);
    if (!richiamo) return res.status(404).json({ message: 'Richiamo non trovato.' });
    return res.json(richiamo);
  } catch (err) {
    console.error('Errore nel prendere in carico il richiamo:', err);
    return res.status(500).json({ message: 'Errore nel prendere in carico il richiamo.' });
  }
});

module.exports = router;
