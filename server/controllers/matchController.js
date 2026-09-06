const Candidate = require('../models/Candidate');
const { getMatchScore } = require('../services/matchService');
const { generateInterviewQuestions } = require('../services/aiService');

/**
 * POST /api/v1/match
 *
 * Body:
 *   {
 *     "job_description": "…",              // required
 *     "candidate_ids": ["66f…", "66f…"]    // optional; omit to score every candidate
 *   }
 *
 * For each candidate this runs the full pipeline:
 *   1. Python ML service  -> fit_score, matched_skills, missing_skills
 *   2. Gemini             -> 3 interview questions based on the resume + missing skills
 *   3. MongoDB            -> save all four fields onto the Candidate document
 */
async function matchCandidates(req, res) {
  const { job_description, candidate_ids } = req.body;

  // ---- 1. Validate input ----
  if (typeof job_description !== 'string' || job_description.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'job_description is required and must be a non-empty string',
    });
  }

  try {
    // ---- 2. Load the candidates to score ----
    // If candidate_ids was supplied, score just those; otherwise score everyone.
    const filter = Array.isArray(candidate_ids) && candidate_ids.length > 0
      ? { _id: { $in: candidate_ids } }
      : {};

    const candidates = await Candidate.find(filter);

    if (candidates.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No candidates found to match. Add candidates via POST /api/v1/candidates first.',
      });
    }

    const results = [];
    const failures = [];

    // ---- 3. Run the pipeline for each candidate ----
    // A simple sequential loop: it keeps the order predictable and avoids
    // firing dozens of Gemini requests at once and hitting a rate limit.
    for (const candidate of candidates) {
      try {
        // 3a. Semantic score + skills diff from the Python service.
        const { fit_score, matched_skills, missing_skills } = await getMatchScore(
          job_description,
          candidate.resume_text
        );

        // 3b. Interview questions from Gemini. This is a "nice to have": if it
        // fails we still keep the scores rather than losing the whole result.
        let interview_questions = [];
        let questionsWarning = null;

        try {
          interview_questions = await generateInterviewQuestions(
            candidate.resume_text,
            missing_skills
          );
        } catch (geminiError) {
          questionsWarning = geminiError.message;
          console.error(`Gemini failed for ${candidate.email}: ${geminiError.message}`);
        }

        // 3c. Save everything back onto the candidate document.
        candidate.fit_score = fit_score;
        candidate.matched_skills = matched_skills;
        candidate.missing_skills = missing_skills;
        candidate.interview_questions = interview_questions;
        candidate.job_description = job_description;
        candidate.last_matched_at = new Date();

        await candidate.save();

        results.push({
          _id: candidate._id,
          name: candidate.name,
          email: candidate.email,
          fit_score,
          matched_skills,
          missing_skills,
          interview_questions,
          ...(questionsWarning && { warning: `Interview questions unavailable: ${questionsWarning}` }),
        });
      } catch (candidateError) {
        // One bad candidate should not abort the whole batch.
        console.error(`Match failed for ${candidate.email}: ${candidateError.message}`);
        failures.push({
          _id: candidate._id,
          email: candidate.email,
          error: candidateError.message,
        });
      }
    }

    // If every single candidate failed, the cause is systemic (ML service down,
    // for example) - report it as a server error rather than a success.
    if (results.length === 0) {
      return res.status(502).json({
        success: false,
        error: 'Matching failed for every candidate',
        failures,
      });
    }

    // ---- 4. Return the best fits first ----
    results.sort((a, b) => b.fit_score - a.fit_score);

    return res.status(200).json({
      success: true,
      matched: results.length,
      results,
      ...(failures.length > 0 && { failures }),
    });
  } catch (error) {
    console.error(`POST /api/v1/match failed: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { matchCandidates };
