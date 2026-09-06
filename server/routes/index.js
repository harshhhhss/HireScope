const express = require('express');
const candidateRoutes = require('./candidateRoutes');
const matchRoutes = require('./matchRoutes');

const router = express.Router();

// Everything here is mounted under /api/v1 by server.js.
router.use('/candidates', candidateRoutes);
router.use('/match', matchRoutes);

module.exports = router;
