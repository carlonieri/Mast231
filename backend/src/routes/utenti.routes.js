const express = require('express');

const { listaUtenti, creaUtente, aggiornaUtente } = require('../services/auth.service');
const { richiedeTitolare } = require('../middleware/auth.middleware');

const router = express.Router();

// Gestione account (titolare + operatori): riservata al titolare. La
// route è già protetta da richiedeAutenticazione a livello globale
// (routes/index.js) — qui si aggiunge solo il controllo di ruolo.
router.use(richiedeTitolare);

router.get('/', async (req, res) => {
  try {
    const utenti = await listaUtenti();
    res.json(utenti);
  } catch (err) {
    console.error('Errore nel recuperare gli utenti:', err);
    res.status(500).json({ message: 'Errore nel recuperare gli utenti.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome, email, password, ruolo } = req.body || {};
    const utente = await creaUtente({ nome, email, password, ruolo });
    res.status(201).json(utente);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    console.error("Errore nel creare l'utente:", err);
    return res.status(500).json({ message: "Errore nel creare l'utente." });
  }
});

// Attiva/disattiva, cambia ruolo/nome, o resetta la password (nessun campo è
// obbligatorio: si aggiorna solo quello passato).
router.patch('/:id', async (req, res) => {
  try {
    const { attivo, ruolo, nome, password } = req.body || {};
    const utente = await aggiornaUtente(req.params.id, { attivo, ruolo, nome, password });
    if (!utente) return res.status(404).json({ message: 'Utente non trovato.' });
    return res.json(utente);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    console.error("Errore nell'aggiornare l'utente:", err);
    return res.status(500).json({ message: "Errore nell'aggiornare l'utente." });
  }
});

module.exports = router;
