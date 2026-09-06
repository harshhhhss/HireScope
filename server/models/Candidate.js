const mongoose = require('mongoose');

/**
 * A candidate is one person's resume, plus the results of matching that resume
 * against a job description.
 *
 * The bottom four fields (fit_score, matched_skills, missing_skills,
 * interview_questions) start empty and are filled in by POST /api/v1/match.
 */
const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Candidate email is required'],
      trim: true,
      lowercase: true,
      unique: true,
    },
    // The raw text of the resume. This is what we send to the ML service.
    resume_text: {
      type: String,
      required: [true, 'Resume text is required'],
    },

    // ---- Filled in by the match pipeline ----

    // Semantic similarity between the job description and this resume, 0-100.
    fit_score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Skills the job asks for that this candidate has.
    matched_skills: {
      type: [String],
      default: [],
    },
    // Skills the job asks for that this candidate is missing.
    missing_skills: {
      type: [String],
      default: [],
    },
    // Three Gemini-generated questions tailored to this resume.
    interview_questions: {
      type: [String],
      default: [],
    },
    // The job description this candidate was last scored against, so a stored
    // fit_score always has the context that produced it.
    job_description: {
      type: String,
      default: '',
    },
    // When the match last ran. Useful for showing "scored 2 minutes ago".
    last_matched_at: {
      type: Date,
      default: null,
    },
  },
  // Adds createdAt and updatedAt automatically.
  { timestamps: true }
);

module.exports = mongoose.model('Candidate', candidateSchema);
