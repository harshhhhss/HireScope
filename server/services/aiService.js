const axios = require('axios');

/**
 * Gemini client for HireScope.
 *
 * Two analyses live here, both built on the same request helper:
 *   1. generateInterviewQuestions() - recruiter flow: given a resume and the
 *      skills it is missing, write three interview questions.
 *   2. scoreResumeQuality()         - student flow: given a resume on its own,
 *      with no job description, rate it and say how to improve it.
 *
 * Everything shared between them - auth, the retry/backoff loop, truncation
 * checks, digging the answer out of the response - lives in requestGemini().
 * Each analysis only has to supply a prompt and a parser.
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
 * Strip a markdown code fence from a reply.
 *
 * We ask for JSON via responseMimeType, but models still sometimes wrap the
 * answer in a ```json fence. Both parsers below start by removing it.
 */
function stripJsonFences(rawText) {
  return rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
}

/**
 * Pull a clean array of 3 question strings out of whatever Gemini replied with.
 *
 * If JSON.parse fails we fall back to reading the reply line by line - a
 * slightly messy answer is better than a failed request.
 */
function parseQuestions(rawText) {
  const cleaned = stripJsonFences(rawText);

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
 * Send one prompt to Gemini and return the answer as raw text.
 *
 * This is the single place that knows how to talk to the API: auth, the
 * retry/backoff loop, the truncation check and pulling the text back out.
 * Callers supply a prompt and do their own parsing, so adding a new kind of
 * analysis does not mean copying any of this.
 *
 * @param {string} prompt      - the full prompt to send
 * @param {object} [options]
 * @param {number} [options.temperature] - 0 is deterministic, higher is freer
 * @param {string} [options.label]       - name used in log lines and errors
 * @returns {Promise<string>} the reply text, never empty
 */
async function requestGemini(prompt, { temperature = 0.7, label = 'request' } = {}) {
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
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            // Asking for JSON up front makes the parsers succeed far more often.
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
      // that would then be shown to the user as real advice.
      if (finishReason === 'MAX_TOKENS') {
        throw new Error(
          `Gemini hit the ${MAX_OUTPUT_TOKENS}-token limit before finishing its answer`
        );
      }

      const rawText = extractText(response);

      if (!rawText) {
        throw new Error(`Gemini returned no text (finishReason: ${finishReason ?? 'unknown'})`);
      }

      return rawText;
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
        `Gemini ${label} attempt ${attempt}/${MAX_ATTEMPTS} failed with ${status}; retrying in ${Math.round(delay / 1000)}s`
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

/**
 * Generate 3 personalised interview questions for one candidate.
 *
 * @param {string} resumeText       - the candidate's resume text
 * @param {string[]} missingSkills  - skills from the job the resume does not show
 * @returns {Promise<string[]>} exactly up to 3 question strings
 */
async function generateInterviewQuestions(resumeText, missingSkills = []) {
  const rawText = await requestGemini(buildPrompt(resumeText, missingSkills), {
    // Some creativity, but not so much that questions drift off-resume.
    temperature: 0.7,
    label: 'interview questions',
  });

  const questions = parseQuestions(rawText);

  if (questions.length === 0) {
    throw new Error('Could not parse any questions from the Gemini response');
  }

  return questions;
}

/**
 * Build the resume-quality prompt.
 *
 * Deliberately has no job description in it: this is the student flow, where
 * someone wants to know whether their resume is any good before they pick a
 * role to apply for.
 *
 * The rules push hard against generic filler. "Add more detail" helps nobody;
 * "quantify the DevPilot AI project - how many users, how much faster?" is
 * something the reader can actually act on this afternoon.
 */
function buildResumeQualityPrompt(resumeText) {
  return `You are a senior engineering hiring manager reviewing a resume. You have read thousands.

Judge the resume below on its own merits. There is no specific job to compare it against.

Score it out of 100, weighing:
- Concrete, quantified impact rather than lists of responsibilities
- Evidence of real projects, with the technologies actually named
- Clarity and structure a reader can scan in 30 seconds
- Signs of depth (why decisions were made) rather than only breadth

Rules for your answer:
- "strengths": 2 to 4 items. Each must point at something specific in this resume, quoting the project or technology by name.
- "improvements": 3 to 5 items. Each must be a concrete action on THIS resume, naming the exact section or project to change.
- Never give generic advice like "add more detail" or "use action verbs". Say which project needs a number, or which claim needs evidence.
- Each item must be one sentence, under 30 words.
- Be honest. A weak resume should score below 50.

Resume:
"""
${resumeText}
"""

Return ONLY a JSON object in exactly this shape:
{"overall_score": 72, "strengths": ["...", "..."], "improvements": ["...", "...", "..."]}`;
}

/**
 * Turn the model's reply into a result we are willing to show the user.
 *
 * Everything is clamped and bounded here rather than trusted: the score is
 * forced into 0-100, the lists are coerced to strings and capped. A malformed
 * reply should produce a small, sane object or throw - never leak raw model
 * output into the UI.
 *
 * @returns {{overall_score: number, strengths: string[], improvements: string[]}}
 */
function parseResumeQuality(rawText) {
  const cleaned = stripJsonFences(rawText);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    throw new Error('Gemini did not return valid JSON for the resume score');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Gemini returned an unexpected shape for the resume score');
  }

  // Check for null/undefined explicitly before converting: Number(null) is 0,
  // not NaN, so a missing score would otherwise sail through as a real 0.
  const raw = parsed.overall_score;
  const score = raw === null || raw === undefined ? NaN : Number(raw);
  if (!Number.isFinite(score)) {
    throw new Error('Gemini did not return a numeric overall_score');
  }

  // Only strings and numbers become list items. Without that guard String(null)
  // yields the literal text "null", which is truthy and would be shown as advice.
  const toList = (value, max) =>
    (Array.isArray(value) ? value : [])
      .filter((item) => typeof item === 'string' || Number.isFinite(item))
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, max);

  const strengths = toList(parsed.strengths, 4);
  const improvements = toList(parsed.improvements, 5);

  if (strengths.length === 0 && improvements.length === 0) {
    throw new Error('Gemini returned no strengths or improvements');
  }

  return {
    // Round to one decimal so the UI never renders 71.99999999.
    overall_score: Math.round(Math.min(100, Math.max(0, score)) * 10) / 10,
    strengths,
    improvements,
  };
}

/**
 * Score one resume on its own, with no job description involved.
 *
 * @param {string} resumeText - the resume to review
 * @returns {Promise<{overall_score: number, strengths: string[], improvements: string[]}>}
 */
async function scoreResumeQuality(resumeText) {
  const rawText = await requestGemini(buildResumeQualityPrompt(resumeText), {
    // Lower than the interview questions: this is a judgement, and we want the
    // same resume to score about the same each time it is checked.
    temperature: 0.3,
    label: 'resume score',
  });

  return parseResumeQuality(rawText);
}

module.exports = {
  generateInterviewQuestions,
  scoreResumeQuality,
  buildPrompt,
  buildResumeQualityPrompt,
  parseQuestions,
  parseResumeQuality,
  extractText,
  requestGemini,
};
