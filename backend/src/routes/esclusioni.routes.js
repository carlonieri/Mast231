const express = require('express');

const { listEsclusioni } = require('../services/esclusioni.service');
const { buildXlsxBuffer } = require('../services/export.service');

const router = express.Router();

// Lista indirizzi esclusi/rimossi
router.get('/', async (req, res) => {
  try {
    const esclusioni = await listEsclusioni();
    res.json(esclusioni);
  } catch (err) {
    console.error('Errore nel recuperare le esclusioni:', err);
    res.status(500).json({ message: 'Errore nel recuperare le esclusioni.' });
  }
});

// Export Excel degli esclusi
router.get('/export', async (req, res) => {
  try {
    const esclusioni = await listEsclusioni();
    const buffer = await buildXlsxBuffer({
      sheetName: 'Esclusi',
      columns: [
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Data esclusione', key: 'data', width: 20 },
        { header: 'Motivo', key: 'motivo', width: 40 },
      ],
      rows: esclusioni,
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="esclusi.xlsx"');
    res.send(buffer);
  } catch (err) {
    console.error("Errore nel generare l'export:", err);
    res.status(500).json({ message: "Errore nel generare l'export." });
  }
});

// Aggiunge un'esclusione manuale — non ancora implementato in questo giro
// (il percorso automatico è già coperto da removeLeadForOptOut in leads.service.js)
router.post('/', (req, res) => {
  res.status(501).json({ message: 'Non ancora implementato' });
});

module.exports = router;
