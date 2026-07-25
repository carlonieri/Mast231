const express = require('express');

const router = express.Router();

// Login web app (spec, requisito #10)
router.post('/login', (req, res) => {
  res.status(501).json({ message: 'Non ancora implementato' });
});

router.post('/logout', (req, res) => {
  res.status(501).json({ message: 'Non ancora implementato' });
});

module.exports = router;
