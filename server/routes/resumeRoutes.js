const express = require('express');
const multer = require('multer');

const { scoreResume, uploadResume, matchResume } = require('../controllers/resumeController');
const { MAX_FILE_BYTES } = require('../services/resumeTextService');

const router = express.Router();

/**
 * Uploads are held in memory, never written to disk.
 *
 * We only need the bytes long enough to pull the text out, so there is no
 * upload directory to create, secure, or clean up, and no filename from the
 * user ever reaches the filesystem. The 5MB cap keeps memory bounded.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_BYTES,
    files: 1,
  },
});

/**
 * Turn multer's own errors into the same { success, error } shape every other
 * route returns.
 *
 * Without this an oversized file rejects with a raw MulterError and Express's
 * default handler answers with an HTML stack trace, which the client cannot
 * parse and the user cannot read.
 */
function handleUploadErrors(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: `That file is larger than ${MAX_FILE_BYTES / 1024 / 1024}MB. Upload a smaller file.`,
      LIMIT_FILE_COUNT: 'Upload one file at a time.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field. Send the file in a field named "resume".',
    };

    return res.status(400).json({
      success: false,
      error: messages[err.code] || `Upload failed: ${err.message}`,
    });
  }

  return next(err);
}

// POST /api/v1/resume/score  - rate a resume on its own, no job description
router.post('/score', scoreResume);

// POST /api/v1/resume/upload - PDF or DOCX in, plain text out
// single('resume') means one file, in a form field named "resume".
router.post('/upload', upload.single('resume'), handleUploadErrors, uploadResume);

// POST /api/v1/resume/match  - score one resume against one job description
router.post('/match', matchResume);

module.exports = router;
