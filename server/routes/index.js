const express = require('express');
const candidateRoutes = require('./candidateRoutes');
const matchRoutes = require('./matchRoutes');
const resumeRoutes = require('./resumeRoutes');

const router = express.Router();

// Everything here is mounted under /api/v1 by server.js.
router.use('/candidates', candidateRoutes);
router.use('/match', matchRoutes);
// Self-service student flow: score / upload / match one resume, nothing stored.
router.use('/resume', resumeRoutes);

module.exports = router;
