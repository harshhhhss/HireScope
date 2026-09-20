const { getMatchScore } = require('../services/matchService');
const {
  generateInterviewQuestions,
  scoreResumeQuality,
  evaluateInterviewAnswer,
  generateCoverLetter,
} = require('../services/aiService');
const { extractResumeText } = require('../services/resumeTextService');

/**
 * The self-service student flow: someone checking their own resume before they
 * apply, rather than a recruiter screening a pool of candidates.
 *
 * Nothing here touches the Candidate model. These endpoints read a resume that
 * was pasted or uploaded a moment ago, answer, and forget it - a student
 * checking their CV should not end up in a recruiter's candidate list.
 */

// Long resumes cost tokens and add nothing; this is far more than any real CV.
const MAX_RESUME_CHARACTERS = 25000;

/**
 * Shared validation for the pasted-text fields.
 * @returns {string|null} an error message, or null when the value is fine
 */
function validateText(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return `${fieldName} is required and must be a non-empty string`;
  }
  if (value.length > MAX_RESUME_CHARACTERS) {
    return `${fieldName} is too long (${value.length} characters, limit ${MAX_RESUME_CHARACTERS})`;
  }
  return null;
}

/**
 * POST /api/v1/resume/score
 *
 * Body: { "resume_text": "…" }
 *
 * Rates a resume on its own, with no job description. Saves nothing.
 */
async function scoreResume(req, res) {
  const { resume_text } = req.body;

  const invalid = validateText(resume_text, 'resume_text');
  if (invalid) {
    return res.status(400).json({ success: false, error: invalid });
  }

  try {
    const analysis = await scoreResumeQuality(resume_text.trim());

    return res.status(200).json({ success: true, ...analysis });
  } catch (error) {
    console.error(`POST /api/v1/resume/score failed: ${error.message}`);

    // Unlike the recruiter flow there is no partial result worth keeping: the
    // score IS the response. So this reports the failure rather than degrading,
    // but still as a clean message the UI can render.
    return res.status(502).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/v1/resume/upload
 *
 * Multipart body with a single "resume" file (PDF or DOCX).
 *
 * Returns the extracted plain text so the browser can drop it into the same
 * textarea a user could have typed into. Deliberately does no analysis: that
 * keeps upload usable by the student flow and the recruiter flow alike, and
 * means a failed upload costs no Gemini quota.
 */
async function uploadResume(req, res) {
  try {
    const { text, characters, format } = await extractResumeText(req.file);

    return res.status(200).json({
      success: true,
      resume_text: text,
      characters,
      format,
      filename: req.file.originalname,
    });
  } catch (error) {
    // extractResumeText throws messages already written for a human, so this
    // is a 400 (their file was wrong), not a 500 (we broke).
    return res.status(400).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/v1/resume/match
 *
 * Body: { "resume_text": "…", "job_description": "…" }
 *
 * The same pipeline POST /api/v1/match runs, but for one resume held in the
 * request rather than a pool of stored candidates, and with no database write.
 * That endpoint is untouched; this reuses its two services.
 */
async function matchResume(req, res) {
  const { resume_text, job_description } = req.body;

  const invalidResume = validateText(resume_text, 'resume_text');
  if (invalidResume) {
    return res.status(400).json({ success: false, error: invalidResume });
  }

  const invalidJob = validateText(job_description, 'job_description');
  if (invalidJob) {
    return res.status(400).json({ success: false, error: invalidJob });
  }

  try {
    // 1. Semantic score + skills diff from the Python service. Without this
    //    there is no result at all, so a failure here fails the request.
    const { fit_score, matched_skills, missing_skills } = await getMatchScore(
      job_description.trim(),
      resume_text.trim()
    );

    // 2. Interview questions are the optional half, exactly as in the
    //    recruiter flow: if Gemini is rate limited we still return the score
    //    and skills rather than losing the whole answer.
    let interview_questions = [];
    let warning;

    try {
      interview_questions = await generateInterviewQuestions(resume_text.trim(), missing_skills);
    } catch (geminiError) {
      warning = `Interview questions unavailable: ${geminiError.message}`;
      console.error(`Gemini failed during resume match: ${geminiError.message}`);
    }

    return res.status(200).json({
      success: true,
      fit_score,
      matched_skills,
      missing_skills,
      interview_questions,
      ...(warning && { warning }),
    });
  } catch (error) {
    console.error(`POST /api/v1/resume/match failed: ${error.message}`);
    return res.status(502).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/v1/resume/interview-feedback
 *
 * Body: { "question": "…", "answer": "…", "resume_text": "…", "missing_skills": [] }
 *
 * Grades one practice answer. Saves nothing - this is practice, and a student
 * rehearsing should not be leaving a record behind.
 */
async function interviewFeedback(req, res) {
  const { question, answer, resume_text, missing_skills } = req.body;

  const invalidQuestion = validateText(question, 'question');
  if (invalidQuestion) {
    return res.status(400).json({ success: false, error: invalidQuestion });
  }

  const invalidAnswer = validateText(answer, 'answer');
  if (invalidAnswer) {
    return res.status(400).json({ success: false, error: invalidAnswer });
  }

  const invalidResume = validateText(resume_text, 'resume_text');
  if (invalidResume) {
    return res.status(400).json({ success: false, error: invalidResume });
  }

  try {
    const feedback = await evaluateInterviewAnswer(
      question.trim(),
      resume_text.trim(),
      Array.isArray(missing_skills) ? missing_skills : [],
      answer.trim()
    );

    return res.status(200).json({ success: true, ...feedback });
  } catch (error) {
    console.error(`POST /api/v1/resume/interview-feedback failed: ${error.message}`);
    return res.status(502).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/v1/resume/cover-letter
 *
 * Body: { "resume_text": "…", "job_description": "…", "matched_skills": [] }
 *
 * Drafts a cover letter grounded in the resume. Saves nothing.
 */
async function coverLetter(req, res) {
  const { resume_text, job_description, matched_skills } = req.body;

  const invalidResume = validateText(resume_text, 'resume_text');
  if (invalidResume) {
    return res.status(400).json({ success: false, error: invalidResume });
  }

  const invalidJob = validateText(job_description, 'job_description');
  if (invalidJob) {
    return res.status(400).json({ success: false, error: invalidJob });
  }

  try {
    const letter = await generateCoverLetter(
      resume_text.trim(),
      job_description.trim(),
      Array.isArray(matched_skills) ? matched_skills : []
    );

    return res.status(200).json({ success: true, cover_letter: letter });
  } catch (error) {
    console.error(`POST /api/v1/resume/cover-letter failed: ${error.message}`);
    return res.status(502).json({ success: false, error: error.message });
  }
}

module.exports = { scoreResume, uploadResume, matchResume, interviewFeedback, coverLetter };
