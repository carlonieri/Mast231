const express = require('express');

const { trovaUtentePerEmail, verificaPassword, pubblico } = require('../services/auth.service');
const { richiedeAutenticazione } = require('../middleware/auth.middleware');

const router = express.Router();

// Login web app (spec, requisito #10). Sessione lato server (cookie httpOnly),
// non un token gestito dal frontend: più semplice e senza bisogno di
// refresh-token per un gestionale interno a pochi utenti.
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e password sono obbligatorie.' });
    }

    const utente = await trovaUtentePerEmail(email);
    if (!utente || !utente.attivo) {
      return res.status(401).json({ message: 'Credenziali non valide.' });
    }

    const valida = await verificaPassword(password, utente.password_hash);
    if (!valida) {
      return res.status(401).json({ message: 'Credenziali non valide.' });
    }

    req.session.utenteId = utente.id;
    return res.json(pubblico(utente));
  } catch (err) {
    console.error('Errore nel login:', err);
    return res.status(500).json({ message: 'Errore nel login.' });
  }
});

router.post('/logout', (req, res) => {
  if (!req.session) return res.status(204).end();
  req.session.destroy(() => {
    res.clearCookie('mast231.sid');
    res.status(204).end();
  });
});

// Utente della sessione corrente — usato dal frontend all'avvio per sapere
// se mostrare il login o l'app.
router.get('/me', richiedeAutenticazione, (req, res) => {
  res.json(req.utente);
});

module.exports = router;
