const express = require('express');
const {
  searchJobListings,
  listSupportedCompanies,
  searchCompanyJobListings,
  getCompanyJobDetail,
} = require('../controllers/jobController');
const { jobSearchLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// GET /api/v1/jobs/search?q=<keywords>&location=<optional>
router.get('/search', jobSearchLimiter, searchJobListings);

// GET /api/v1/jobs/companies - which company boards can be browsed
router.get('/companies', listSupportedCompanies);

// GET /api/v1/jobs/company/:slug?q=&location= - search one company's own board
router.get('/company/:slug', jobSearchLimiter, searchCompanyJobListings);

// GET /api/v1/jobs/company/:slug/:jobId - the full text of one posting
router.get('/company/:slug/:jobId', jobSearchLimiter, getCompanyJobDetail);

module.exports = router;
