const { trovaUtentePerId, pubblico } = require('../services/auth.service');

// Protegge le route: richiede una sessione valida con un utente attivo.
// Attacca req.utente (senza password_hash) per le route successive.
async function richiedeAutenticazione(req, res, next) {
  if (!req.session || !req.session.utenteId) {
    return res.status(401).json({ message: 'Accesso richiesto.' });
  }
  try {
    const utente = await trovaUtentePerId(req.session.utenteId);
    if (!utente || !utente.attivo) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: 'Accesso richiesto.' });
    }
    req.utente = pubblico(utente);
    return next();
  } catch (err) {
    return next(err);
  }
}

// Da usare DOPO richiedeAutenticazione: riservato al titolare (es. gestione utenti).
function richiedeTitolare(req, res, next) {
  if (!req.utente || req.utente.ruolo !== 'titolare') {
    return res.status(403).json({ message: 'Riservato al titolare.' });
  }
  return next();
}

module.exports = { richiedeAutenticazione, richiedeTitolare };
