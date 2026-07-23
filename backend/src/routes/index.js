const express = require('express');

const router = express.Router();

router.use('/leads', require('./leads.routes'));
router.use('/follow-up', require('./follow-up.routes'));
router.use('/esclusioni', require('./esclusioni.routes'));
router.use('/caricamenti', require('./caricamenti.routes'));
router.use('/gruppi-export-richiamo', require('./gruppi-export-richiamo.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/auth', require('./auth.routes'));

module.exports = router;
