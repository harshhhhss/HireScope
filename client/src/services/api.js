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

/**
 * POST /api/v1/resume/score - rate one resume on its own, no job description.
 *
 * Nothing is saved: this is the self-service student flow, not the recruiter
 * candidate pool.
 *
 * @returns {Promise<{overall_score: number, strengths: string[], improvements: string[]}>}
 */
export async function scoreResume(resumeText) {
  try {
    const response = await api.post('/resume/score', { resume_text: resumeText });
    const { overall_score, strengths, improvements } = response.data;
    return { overall_score, strengths, improvements };
  } catch (error) {
    throw toReadableError(error);
  }
}

/**
 * POST /api/v1/resume/upload - send a PDF or DOCX, get its text back.
 *
 * The shared axios instance sets Content-Type: application/json, which would
 * break a multipart request. Setting it to undefined here lets the browser
 * write the header itself, including the multipart boundary it generates.
 *
 * @param {File} file - from an <input type="file">
 * @returns {Promise<{resume_text: string, characters: number, format: string, filename: string}>}
 */
export async function uploadResumeFile(file) {
  try {
    const formData = new FormData();
    // The field name must be "resume" - that is what upload.single() expects.
    formData.append('resume', file);

    const response = await api.post('/resume/upload', formData, {
      headers: { 'Content-Type': undefined },
    });

    const { resume_text, characters, format, filename } = response.data;
    return { resume_text, characters, format, filename };
  } catch (error) {
    throw toReadableError(error);
  }
}

/**
 * POST /api/v1/resume/match - score one resume against one job description.
 *
 * Same pipeline the recruiter /match endpoint runs, but for a single resume
 * held in the request and with nothing written to the database.
 *
 * @returns {Promise<{fit_score: number, matched_skills: string[], missing_skills: string[], interview_questions: string[], warning?: string}>}
 */
export async function matchMyResume(resumeText, jobDescription) {
  try {
    const response = await api.post('/resume/match', {
      resume_text: resumeText,
      job_description: jobDescription,
    });

    const { fit_score, matched_skills, missing_skills, interview_questions, warning } =
      response.data;

    return {
      fit_score,
      matched_skills: matched_skills ?? [],
      missing_skills: missing_skills ?? [],
      interview_questions: interview_questions ?? [],
      warning,
    };
  } catch (error) {
    throw toReadableError(error);
  }
}

/**
 * GET /api/v1/jobs/search - real openings from Adzuna.
 *
 * Resolves to `{ configured: false }` rather than throwing when the server has
 * no Adzuna keys, so the caller can hide the panel instead of showing an error
 * for something the student cannot fix.
 *
 * @returns {Promise<{configured: boolean, results: object[], error?: string}>}
 */
export async function searchJobs(keywords, location = '') {
  try {
    const response = await api.get('/jobs/search', {
      params: { q: keywords, ...(location ? { location } : {}) },
    });
    return { configured: true, results: response.data.results ?? [] };
  } catch (error) {
    if (error.response?.data?.configured === false) {
      return { configured: false, results: [], error: error.response.data.error };
    }
    throw toReadableError(error);
  }
}

/**
 * POST /api/v1/resume/interview-feedback - grade one practice answer.
 * @returns {Promise<{verdict: string, summary: string, suggestions: string[]}>}
 */
export async function getInterviewFeedback({ question, answer, resumeText, missingSkills }) {
  try {
    const response = await api.post('/resume/interview-feedback', {
      question,
      answer,
      resume_text: resumeText,
      missing_skills: missingSkills ?? [],
    });
    const { verdict, summary, suggestions } = response.data;
    return { verdict, summary, suggestions: suggestions ?? [] };
  } catch (error) {
    throw toReadableError(error);
  }
}

/**
 * POST /api/v1/resume/cover-letter - draft a letter grounded in the resume.
 * @returns {Promise<string>} the letter as plain text
 */
export async function getCoverLetter({ resumeText, jobDescription, matchedSkills }) {
  try {
    const response = await api.post('/resume/cover-letter', {
      resume_text: resumeText,
      job_description: jobDescription,
      matched_skills: matchedSkills ?? [],
    });
    return response.data.cover_letter;
  } catch (error) {
    throw toReadableError(error);
  }
}

export default api;
