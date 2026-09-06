const express = require('express');
const { matchCandidates } = require('../controllers/matchController');

const router = express.Router();

// POST /api/v1/match
router.post('/', matchCandidates);

module.exports = router;
