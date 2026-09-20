const express = require('express');
const candidateRoutes = require('./candidateRoutes');
const matchRoutes = require('./matchRoutes');
const resumeRoutes = require('./resumeRoutes');
const jobRoutes = require('./jobRoutes');

const router = express.Router();

// Everything here is mounted under /api/v1 by server.js.
router.use('/candidates', candidateRoutes);
router.use('/match', matchRoutes);
// Self-service student flow: score / upload / match one resume, nothing stored.
router.use('/resume', resumeRoutes);
// Real job openings from Adzuna, used to autofill a job description.
router.use('/jobs', jobRoutes);

module.exports = router;
