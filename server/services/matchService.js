const axios = require('axios');

/**
 * Thin HTTP client for the Python ML microservice (ml-service/app.py).
 *
 * This file knows exactly one thing: how to ask the ML service to score a
 * resume against a job description. It does not touch the database and it does
 * not know about Gemini - that keeps it easy to test and easy to swap out.
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Embedding a pair of texts is fast, but the very first request after startup
// can be slower while the model warms up. 15s is a generous ceiling.
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Call POST /match on the Python service.
 *
 * @param {string} jobDescription - the job description text
 * @param {string} resumeText     - one candidate's resume text
 * @returns {Promise<{fit_score: number, similarity: number|null, top_matches: object[], matched_skills: string[], missing_skills: string[]}>}
 */
async function getMatchScore(jobDescription, resumeText) {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/match`,
      {
        job_description: jobDescription,
        resume_text: resumeText,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );

    const { fit_score, similarity, top_matches, matched_skills, missing_skills } = response.data;

    // Normalise the shape before it travels any further, so a malformed
    // response from the ML service cannot put junk into MongoDB.
    return {
      fit_score: typeof fit_score === 'number' ? fit_score : 0,
      // The raw cosine value behind fit_score. Passed through so the client can
      // show the arithmetic instead of only the result.
      similarity: typeof similarity === 'number' ? similarity : null,
      // The sentence pairs that best explain the score. Defaults to empty so an
      // older ml-service that does not send them degrades quietly.
      top_matches: Array.isArray(top_matches) ? top_matches : [],
      matched_skills: Array.isArray(matched_skills) ? matched_skills : [],
      missing_skills: Array.isArray(missing_skills) ? missing_skills : [],
    };
  } catch (error) {
    // axios puts the server's JSON body on error.response.data when the ML
    // service answered with a 4xx/5xx; otherwise it never answered at all.
    if (error.response) {
      const detail = error.response.data?.error || 'unknown error';
      throw new Error(`ML service returned ${error.response.status}: ${detail}`);
    }
    if (error.code === 'ECONNREFUSED') {
      throw new Error(
        `Cannot reach the ML service at ${ML_SERVICE_URL}. Is it running? (cd ml-service && python app.py)`
      );
    }
    throw new Error(`ML service request failed: ${error.message}`);
  }
}

module.exports = { getMatchScore };
