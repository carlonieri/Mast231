const express = require('express');

const { listLeads, getFilterOptions, getLeadDetail, updateLeadStato } = require('../services/leads.service');
const { buildXlsxBuffer } = require('../services/export.service');

const router = express.Router();

function parseStati(query) {
  if (!query) return undefined;
  return String(query)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseFiltri(req) {
  return {
    stati: parseStati(req.query.stato),
    citta: req.query.citta || undefined,
    regione: req.query.regione || undefined,
  };
}

// Lista lead, filtrabile per stato/citta/regione (le sezioni del gestionale)
router.get('/', async (req, res) => {
  try {
    const leads = await listLeads(parseFiltri(req));
    res.json(leads);
  } catch (err) {
    console.error('Errore nel recuperare i lead:', err);
    res.status(500).json({ message: 'Errore nel recuperare i lead.' });
  }
});

// Opzioni per i filtri città/regione (indipendenti dal filtro corrente)
router.get('/opzioni-filtro', async (req, res) => {
  try {
    const opzioni = await getFilterOptions();
    res.json(opzioni);
  } catch (err) {
    console.error('Errore nel recuperare le opzioni filtro:', err);
    res.status(500).json({ message: 'Errore nel recuperare le opzioni filtro.' });
  }
});

// Export Excel della lista lead (stessi filtri della lista)
router.get('/export', async (req, res) => {
  try {
    const leads = await listLeads(parseFiltri(req));
    const buffer = await buildXlsxBuffer({
      sheetName: 'Lead',
      columns: [
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Nome', key: 'nome', width: 25 },
        { header: 'Città', key: 'citta', width: 18 },
        { header: 'Regione', key: 'regione', width: 18 },
        { header: 'Stato', key: 'stato', width: 18 },
        { header: 'Ultima categoria email', key: 'ultima_categoria_email', width: 28 },
        { header: 'Ultimo contatto', key: 'ultima_data_contatto', width: 20 },
      ],
      rows: leads,
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="lead.xlsx"');
    res.send(buffer);
  } catch (err) {
    console.error("Errore nel generare l'export:", err);
    res.status(500).json({ message: "Errore nel generare l'export." });
  }
});

// Dettaglio lead: storico email completo + richiami collegati (avviso anti-duplicazione)
router.get('/:id', async (req, res) => {
  try {
    const lead = await getLeadDetail(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead non trovato.' });
    return res.json(lead);
  } catch (err) {
    console.error('Errore nel recuperare il dettaglio lead:', err);
    return res.status(500).json({ message: 'Errore nel recuperare il dettaglio lead.' });
  }
});

// Aggiorna stato lead (es. classificazione manuale, o segnare "acquisito")
router.patch('/:id', async (req, res) => {
  try {
    const lead = await updateLeadStato(req.params.id, req.body.stato);
    if (!lead) return res.status(404).json({ message: 'Lead non trovato.' });
    return res.json(lead);
  } catch (err) {
    if (err.statusCode === 400) return res.status(400).json({ message: err.message });
    console.error("Errore nell'aggiornare lo stato del lead:", err);
    return res.status(500).json({ message: "Errore nell'aggiornare lo stato del lead." });
  }
});

module.exports = router;
