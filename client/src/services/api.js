import axios from 'axios';

/**
 * Every HTTP call the app makes lives in this file.
 *
 * Components import these functions and never touch axios directly, so if the
 * API moves or a route is renamed there is exactly one place to change.
 */

// import.meta.env is how Vite exposes env vars to the browser. The fallback
// keeps the app working with no .env file at all during local development.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000, // matching a batch runs an ML call + a Gemini call per candidate
});

/**
 * Turn any axios failure into a plain Error carrying a message worth showing.
 *
 * The Node API always answers errors as { success: false, error: "..." }, so we
 * prefer that text; if the request never reached the server there is no body to
 * read and we explain that the API is probably not running.
 */
function toReadableError(error) {
  if (error.response) {
    return new Error(error.response.data?.error || `Request failed (${error.response.status})`);
  }
  if (error.code === 'ECONNABORTED') {
    return new Error('The request timed out. Matching a large batch can take a while.');
  }
  return new Error(
    `Cannot reach the API at ${API_URL}. Is the Node server running? (cd server && npm run dev)`
  );
}

/**
 * POST /api/v1/candidates - add one candidate.
 * @returns {Promise<object>} the saved candidate document
 */
export async function createCandidate({ name, email, resume_text }) {
  try {
    const response = await api.post('/candidates', { name, email, resume_text });
    return response.data.data;
  } catch (error) {
    throw toReadableError(error);
  }
}

/**
 * GET /api/v1/candidates - every candidate, highest fit_score first.
 * @returns {Promise<object[]>}
 */
export async function getCandidates() {
  try {
    const response = await api.get('/candidates');
    return response.data.data;
  } catch (error) {
    throw toReadableError(error);
  }
}

/**
 * GET /api/v1/candidates/:id - one candidate.
 * @returns {Promise<object>}
 */
export async function getCandidateById(id) {
  try {
    const response = await api.get(`/candidates/${id}`);
    return response.data.data;
  } catch (error) {
    throw toReadableError(error);
  }
}

/**
 * POST /api/v1/match - score candidates against a job description.
 *
 * Omitting candidateIds tells the API to score everyone in the database.
 * The API already returns `results` sorted by fit_score, best first.
 *
 * @returns {Promise<{results: object[], failures: object[], matched: number}>}
 */
export async function matchCandidates(jobDescription, candidateIds) {
  try {
    const payload = { job_description: jobDescription };

    // Only send the key when we actually have ids, so the server takes its
    // "score everyone" branch rather than seeing an empty array.
    if (Array.isArray(candidateIds) && candidateIds.length > 0) {
      payload.candidate_ids = candidateIds;
    }

    const response = await api.post('/match', payload);

    return {
      matched: response.data.matched ?? 0,
      results: response.data.results ?? [],
      failures: response.data.failures ?? [],
    };
  } catch (error) {
    throw toReadableError(error);
  }
}

export default api;
