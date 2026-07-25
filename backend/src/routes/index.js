const express = require('express');

const { richiedeAutenticazione } = require('../middleware/auth.middleware');

const router = express.Router();

// /auth non richiede sessione (è come ci si logga); tutto il resto sì.
router.use('/auth', require('./auth.routes'));

router.use(richiedeAutenticazione);

router.use('/leads', require('./leads.routes'));
router.use('/follow-up', require('./follow-up.routes'));
router.use('/esclusioni', require('./esclusioni.routes'));
router.use('/caricamenti', require('./caricamenti.routes'));
router.use('/gruppi-export-richiamo', require('./gruppi-export-richiamo.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/assistente', require('./assistente.routes'));
router.use('/utenti', require('./utenti.routes'));

module.exports = router;
