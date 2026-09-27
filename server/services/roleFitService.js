const axios = require('axios');

/**
 * Client for the ML service's role-fit endpoint.
 *
 * Sibling to matchService: same service, same maths, different question. Where
 * /match asks "how well does this resume fit THIS posting", /role-fit asks
 * "which of our canonical role profiles does it sit closest to".
 *
 * The profiles live in ml-service and are embedded once at its startup, so this
 * is one round trip regardless of how many roles exist.
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Comparing against every cached profile is one encode plus a matrix multiply,
// so this is quick - but the first call after a cold start still waits for the
// model, which is why this is not tighter.
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Score one resume against every role profile.
 *
 * @param {string} resumeText
 * @returns {Promise<{roles: object[], profileCount: number}>}
 */
async function getRoleFit(resumeText) {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/role-fit`,
      { resume_text: resumeText },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );

    const { roles, profile_count } = response.data;

    // Normalise before this travels further, so a malformed response cannot
    // reach the UI as undefined fields.
    return {
      roles: Array.isArray(roles)
        ? roles
            .filter((role) => role && typeof role.fit_score === 'number')
            .map((role) => ({
              id: String(role.id ?? ''),
              title: String(role.title ?? 'Unknown role'),
              branch: String(role.branch ?? 'Other'),
              fit_score: role.fit_score,
              similarity: typeof role.similarity === 'number' ? role.similarity : null,
            }))
        : [],
      profileCount: typeof profile_count === 'number' ? profile_count : 0,
    };
  } catch (error) {
    if (error.response) {
      const detail = error.response.data?.error || 'unknown error';
      throw new Error(`ML service returned ${error.response.status}: ${detail}`);
    }
    if (error.code === 'ECONNREFUSED') {
      throw new Error(
        `Cannot reach the ML service at ${ML_SERVICE_URL}. Is it running? (cd ml-service && python app.py)`
      );
    }
    throw new Error(`Role fit request failed: ${error.message}`);
  }
}

module.exports = { getRoleFit };
