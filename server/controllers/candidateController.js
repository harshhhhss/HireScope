const Candidate = require('../models/Candidate');

/**
 * Basic CRUD for candidates. The match pipeline needs candidates to exist in
 * the database before it can score them, so these endpoints are how resumes
 * get in.
 */

/** POST /api/v1/candidates - create one candidate. */
async function createCandidate(req, res) {
  try {
    const { name, email, resume_text } = req.body;

    if (!name || !email || !resume_text) {
      return res.status(400).json({
        success: false,
        error: 'name, email and resume_text are all required',
      });
    }

    const candidate = await Candidate.create({ name, email, resume_text });

    return res.status(201).json({ success: true, data: candidate });
  } catch (error) {
    // Mongo error 11000 = duplicate key, i.e. this email already exists.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'A candidate with that email already exists',
      });
    }
    console.error(`POST /api/v1/candidates failed: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/** GET /api/v1/candidates - list candidates, highest fit_score first. */
async function getCandidates(req, res) {
  try {
    const candidates = await Candidate.find().sort({ fit_score: -1 });
    return res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates,
    });
  } catch (error) {
    console.error(`GET /api/v1/candidates failed: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/** GET /api/v1/candidates/:id - fetch one candidate by id. */
async function getCandidateById(req, res) {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    return res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    // A malformed ObjectId throws a CastError rather than returning null.
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid candidate id' });
    }
    console.error(`GET /api/v1/candidates/:id failed: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { createCandidate, getCandidates, getCandidateById };
