const axios = require('axios');

/**
 * Gemini client for HireScope.
 *
 * Responsibility: given a resume and the skills the candidate is missing,
 * generate three personalised interview questions.
 *
 * We call the REST API directly with axios instead of pulling in an SDK, so
 * every part of the request is visible in this file.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const REQUEST_TIMEOUT_MS = 30000;

/**
 * Build the prompt we send to Gemini.
 * Kept as its own function so the prompt is easy to read, tweak and review.
 */
function buildPrompt(resumeText, missingSkills) {
  const missing = missingSkills.length > 0 ? missingSkills.join(', ') : 'none identified';

  return `You are an experienced technical interviewer preparing for a screening call.

Read the candidate's resume below and write exactly 3 interview questions.

Rules:
- Question 1 must be specific to something the candidate actually did, quoting a project, technology or role from their resume.
- Questions 2 and 3 must probe the skills the job requires but the resume does not evidence, listed under "Missing skills".
- Each question must be a single sentence, open-ended, and answerable in 2-3 minutes.
- Do not number the questions and do not add any commentary.

Missing skills: ${missing}

Resume:
"""
${resumeText}
"""

Return ONLY a JSON array of 3 strings, for example:
["First question?", "Second question?", "Third question?"]`;
}

/**
 * Pull a clean array of 3 question strings out of whatever Gemini replied with.
 *
 * We ask for JSON, but models sometimes wrap it in a ```json fence, so we strip
 * that first. If JSON.parse still fails we fall back to reading the reply line
 * by line - a slightly messy answer is better than a failed request.
 */
function parseQuestions(rawText) {
  const cleaned = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.map((q) => String(q).trim()).filter(Boolean).slice(0, 3);
    }
  } catch (error) {
    // Not valid JSON - fall through to the line-by-line fallback below.
  }

  return cleaned
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, '').replace(/^"|",?$/g, '').trim())
    .filter((line) => line.length > 0)
    .slice(0, 3);
}

/**
 * Generate 3 personalised interview questions for one candidate.
 *
 * @param {string} resumeText       - the candidate's resume text
 * @param {string[]} missingSkills  - skills from the job the resume does not show
 * @returns {Promise<string[]>} exactly up to 3 question strings
 */
async function generateInterviewQuestions(resumeText, missingSkills = []) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set. Add it to server/.env');
  }

  try {
    const response = await axios.post(
      GEMINI_URL,
      {
        contents: [
          {
            // Gemini's format: a list of turns, each holding a list of parts.
            parts: [{ text: buildPrompt(resumeText, missingSkills) }],
          },
        ],
        generationConfig: {
          // Some creativity, but not so much that questions drift off-resume.
          temperature: 0.7,
          maxOutputTokens: 512,
          // Asking for JSON up front makes parseQuestions succeed far more often.
          responseMimeType: 'application/json',
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          // Sending the key as a header keeps it out of URLs and server logs.
          'x-goog-api-key': GEMINI_API_KEY,
        },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );

    // Dig the generated text out of Gemini's nested response shape.
    const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Gemini returned an empty response');
    }

    const questions = parseQuestions(rawText);

    if (questions.length === 0) {
      throw new Error('Could not parse any questions from the Gemini response');
    }

    return questions;
  } catch (error) {
    if (error.response) {
      const detail = error.response.data?.error?.message || 'unknown error';
      throw new Error(`Gemini API returned ${error.response.status}: ${detail}`);
    }
    throw new Error(`Gemini request failed: ${error.message}`);
  }
}

module.exports = { generateInterviewQuestions, buildPrompt, parseQuestions };
