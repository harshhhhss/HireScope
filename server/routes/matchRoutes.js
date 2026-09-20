const express = require('express');
const { matchCandidates } = require('../controllers/matchController');
const { batchMatchLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// POST /api/v1/match
// One request here costs one Gemini call PER CANDIDATE, hence the tight limit.
router.post('/', batchMatchLimiter, matchCandidates);

module.exports = router;
