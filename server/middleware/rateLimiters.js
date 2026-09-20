const { rateLimit } = require('express-rate-limit');

/**
 * Rate limits for the endpoints that cost something per call.
 *
 * The limits are sized against Gemini's free tier, which is the real scarce
 * resource here - we measured it at 5 requests per minute (the 429 body says
 * `limit: 5`). One student's honest session is about six Gemini calls: score
 * the resume, match a job, get feedback on three answers, draft a letter. The
 * numbers below allow that comfortably while capping anyone hammering it.
 *
 * Note what this cannot do: it keys on IP, so a campus behind one NAT shares a
 * single bucket. There is no fix without accounts - which is an argument for
 * doing auth before any placement-cell rollout, not an argument for a bigger
 * number here.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/** The shape every limiter returns, matching the app's error envelope. */
function limitHandler(req, res) {
  return res.status(429).json({
    success: false,
    error:
      'Too many requests. These run real AI calls on a limited quota, so please wait a few minutes and try again.',
  });
}

const shared = {
  windowMs: WINDOW_MS,
  // Return rate limit info in the standard `RateLimit-*` headers and drop the
  // legacy `X-RateLimit-*` ones.
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: limitHandler,
};

/**
 * One Gemini call per request: /resume/score, /resume/interview-feedback,
 * /resume/cover-letter, /resume/match.
 *
 * 20 per 15 minutes is roughly three full sessions, which leaves room for
 * re-checking a rewritten resume without ever getting in a real user's way.
 */
const aiLimiter = rateLimit({ ...shared, limit: 20 });

/**
 * POST /api/v1/match - the recruiter batch.
 *
 * Deliberately far tighter, because one request here is not one Gemini call:
 * it is one per candidate in the database. Scoring five candidates spends five.
 */
const batchMatchLimiter = rateLimit({ ...shared, limit: 5 });

/**
 * GET /jobs/search - Adzuna, not Gemini.
 *
 * Adzuna's free tier is in the hundreds of calls per day, so this is about
 * politeness to them rather than protecting a scarce quota.
 */
const jobSearchLimiter = rateLimit({ ...shared, limit: 30 });

/**
 * POST /resume/upload - no external quota, but it reads a file up to 5MB into
 * memory and runs a PDF parser over it. On a 512MB instance that is worth
 * bounding even though it costs nothing to call.
 */
const uploadLimiter = rateLimit({ ...shared, limit: 20 });

module.exports = { aiLimiter, batchMatchLimiter, jobSearchLimiter, uploadLimiter };
