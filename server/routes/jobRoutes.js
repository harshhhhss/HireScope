const express = require('express');
const { searchJobListings } = require('../controllers/jobController');
const { jobSearchLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// GET /api/v1/jobs/search?q=<keywords>&location=<optional>
router.get('/search', jobSearchLimiter, searchJobListings);

module.exports = router;
