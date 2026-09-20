const { searchJobs, isConfigured } = require('../services/jobSearchService');

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

module.exports = { searchJobListings };
