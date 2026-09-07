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

// Two reasons for this default:
//   1. It is an alias, so it always points at a current model. Pinning an exact
//      version means the app starts 404ing the day Google retires it, which is
//      exactly what happened to gemini-2.0-flash.
//   2. "lite" is the smaller, cheaper tier. Writing three interview questions
//      does not need a frontier model, and the lite models are far less prone
//      to the 503 "high demand" errors that the flagship flash alias returns.
// Set GEMINI_MODEL in .env to use something else.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const REQUEST_TIMEOUT_MS = 30000;

// Current Gemini models reason internally before answering, and those thinking
// tokens come out of this same budget. Measured on this prompt: ~834 thinking
// tokens before the first word of the answer. A small cap gets eaten entirely
// by thinking and returns truncated nonsense with finishReason MAX_TOKENS.
const MAX_OUTPUT_TOKENS = 4096;

// The API answers 503 "high demand" fairly often; retrying almost always works.
const MAX_ATTEMPTS = 4;
const BASE_RETRY_DELAY_MS = 2000;
// Never sleep longer than this between attempts, so one candidate cannot stall
// a whole batch waiting on a quota window to reopen.
const MAX_RETRY_DELAY_MS = 40000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Work out how long to wait before retrying.
 *
 * On a 429 the API tells us exactly how long to back off, in an error detail
 * of type RetryInfo (e.g. retryDelay: "32.8s"). Honouring that matters: firing
 * again immediately just burns more of an already-exhausted quota. When there
 * is no such hint we fall back to exponential backoff (2s, 4s, 8s...).
 */
function getRetryDelayMs(error, attempt) {
  const details = error.response?.data?.error?.details ?? [];
  const retryInfo = details.find((d) => String(d['@type'] ?? '').includes('RetryInfo'));
  const seconds = parseFloat(retryInfo?.retryDelay);

  if (!Number.isNaN(seconds)) {
    // Add a small margin - retrying on the exact boundary tends to 429 again.
    return Math.min((seconds + 1) * 1000, MAX_RETRY_DELAY_MS);
  }

  return Math.min(BASE_RETRY_DELAY_MS * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS);
}

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
 * Pull the answer text out of Gemini's nested response shape.
 *
 * A response can hold several parts. Reasoning models may return internal
 * "thought" parts next to the real answer, so we skip anything flagged as a
 * thought and join the remaining text parts rather than blindly taking
 * parts[0], which can be a thought and not the answer at all.
 */
function extractText(response) {
  const candidate = response.data?.candidates?.[0];
  if (!candidate) return '';

  const parts = candidate.content?.parts ?? [];

  return parts
    .filter((part) => part.thought !== true && typeof part.text === 'string')
    .map((part) => part.text)
    .join('')
    .trim();
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

  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
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
            maxOutputTokens: MAX_OUTPUT_TOKENS,
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

      const finishReason = response.data?.candidates?.[0]?.finishReason;

      // Truncated output is worse than none: it parses into half a sentence
      // that would then be saved as a real interview question.
      if (finishReason === 'MAX_TOKENS') {
        throw new Error(
          `Gemini hit the ${MAX_OUTPUT_TOKENS}-token limit before finishing its answer`
        );
      }

      const rawText = extractText(response);

      if (!rawText) {
        throw new Error(`Gemini returned no text (finishReason: ${finishReason ?? 'unknown'})`);
      }

      const questions = parseQuestions(rawText);

      if (questions.length === 0) {
        throw new Error('Could not parse any questions from the Gemini response');
      }

      return questions;
    } catch (error) {
      lastError = error;

      // 503 = model overloaded, 429 = rate limited. Both are temporary and
      // worth retrying. A 400 or 404 is our own bug and will fail identically
      // however many times we ask, so we give up immediately.
      const status = error.response?.status;
      const isRetryable = status === 503 || status === 429;

      if (!isRetryable || attempt === MAX_ATTEMPTS) break;

      const delay = getRetryDelayMs(error, attempt);
      console.warn(
        `Gemini attempt ${attempt}/${MAX_ATTEMPTS} failed with ${status}; retrying in ${Math.round(delay / 1000)}s`
      );
      await sleep(delay);
    }
  }

  if (lastError.response) {
    const detail = lastError.response.data?.error?.message || 'unknown error';
    throw new Error(`Gemini API returned ${lastError.response.status}: ${detail}`);
  }
  throw new Error(`Gemini request failed: ${lastError.message}`);
}

module.exports = { generateInterviewQuestions, buildPrompt, parseQuestions, extractText };
