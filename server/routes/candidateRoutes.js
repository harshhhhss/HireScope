const express = require('express');
const {
  createCandidate,
  getCandidates,
  getCandidateById,
} = require('../controllers/candidateController');

const router = express.Router();

// POST /api/v1/candidates  and  GET /api/v1/candidates
router.route('/').post(createCandidate).get(getCandidates);

// GET /api/v1/candidates/:id
router.route('/:id').get(getCandidateById);

module.exports = router;
