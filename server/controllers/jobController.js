const { searchJobs, isConfigured } = require('../services/jobSearchService');
const {
  listCompanies,
  searchCompanyJobs,
  getCompanyJobDescription,
} = require('../services/companyJobsService');

/**
 * Browsing real job openings.
 *
 * This is a convenience on top of the existing flows: it fills in a job
 * description that the user could equally have pasted by hand. Nothing else
 * depends on it, so when Adzuna is unconfigured or down the rest of the app is
 * unaffected - which is why the "not configured" case is reported as a normal
 * response the client can act on rather than an error.
 */

/**
 * GET /api/v1/jobs/search?q=<keywords>&location=<optional>
 */
async function searchJobListings(req, res) {
  const { q, location } = req.query;

  if (typeof q !== 'string' || q.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'q is required, for example /api/v1/jobs/search?q=backend developer',
    });
  }

  // 503 rather than 500: the service is genuinely unavailable rather than
  // broken, and `configured: false` lets the client hide the panel entirely
  // instead of showing a search box that can never work.
  if (!isConfigured()) {
    return res.status(503).json({
      success: false,
      configured: false,
      error:
        'Job search is not configured. Add ADZUNA_APP_ID and ADZUNA_APP_KEY to server/.env - free keys at https://developer.adzuna.com/',
    });
  }

  try {
    const jobs = await searchJobs(q.trim(), (location ?? '').trim());

    return res.status(200).json({
      success: true,
      configured: true,
      count: jobs.length,
      results: jobs,
    });
  } catch (error) {
    console.error(`GET /api/v1/jobs/search failed: ${error.message}`);
    return res.status(502).json({ success: false, configured: true, error: error.message });
  }
}

/**
 * GET /api/v1/jobs/companies
 *
 * The companies whose own boards we can browse. Needs no credentials, so it
 * works even when Adzuna is unconfigured.
 */
function listSupportedCompanies(req, res) {
  return res.status(200).json({ success: true, companies: listCompanies() });
}

/**
 * GET /api/v1/jobs/company/:slug?q=<keywords>&location=<optional>
 *
 * Search one company's own job board. Results carry no description: the board
 * listing with bodies is around 5MB, so the text is fetched for the single
 * posting the user picks, via the endpoint below.
 */
async function searchCompanyJobListings(req, res) {
  const { slug } = req.params;
  const { q, location } = req.query;

  try {
    const jobs = await searchCompanyJobs(slug, (q ?? '').trim(), (location ?? '').trim());
    return res.status(200).json({ success: true, count: jobs.length, results: jobs });
  } catch (error) {
    console.error(`GET /api/v1/jobs/company/${slug} failed: ${error.message}`);
    // An unknown slug is the caller's mistake; anything else is upstream.
    const status = /Unknown company/.test(error.message) ? 400 : 502;
    return res.status(status).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/v1/jobs/company/:slug/:jobId
 *
 * The full text of one posting, ready to drop into the match flow.
 */
async function getCompanyJobDetail(req, res) {
  const { slug, jobId } = req.params;

  try {
    const job = await getCompanyJobDescription(slug, jobId);
    return res.status(200).json({ success: true, ...job });
  } catch (error) {
    console.error(`GET /api/v1/jobs/company/${slug}/${jobId} failed: ${error.message}`);
    const status = /Unknown company|no longer listed/.test(error.message) ? 404 : 502;
    return res.status(status).json({ success: false, error: error.message });
  }
}

module.exports = {
  searchJobListings,
  listSupportedCompanies,
  searchCompanyJobListings,
  getCompanyJobDetail,
};
