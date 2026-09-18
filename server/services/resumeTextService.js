const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Turn an uploaded resume file into plain text.
 *
 * This file knows about document formats and nothing else - no Express, no
 * database, no Gemini. It takes a buffer and gives back a string, which is
 * what both the recruiter flow and the student flow actually need.
 */

// Anything larger is almost certainly not a resume. Enforced by multer before
// we ever get here; repeated in the message so the limit is documented once.
const MAX_FILE_BYTES = 5 * 1024 * 1024;

// The formats we can actually read. Browsers are inconsistent about the MIME
// type they attach to an upload, so the extension is the primary check and the
// MIME type is only a secondary hint.
const SUPPORTED_EXTENSIONS = ['.pdf', '.docx'];

// A resume shorter than this almost certainly means extraction failed - a
// scanned PDF of images, for example, yields a handful of stray characters.
const MIN_USEFUL_CHARACTERS = 30;

/**
 * Tidy up text pulled out of a document.
 *
 * Extractors leave a lot of vertical whitespace behind. Collapsing it keeps the
 * text readable in a textarea and stops us burning Gemini tokens on blank lines.
 */
function normaliseWhitespace(text) {
  return text
    .replace(/\r\n/g, '\n')
    // Collapse runs of 3+ blank lines down to one blank line.
    .replace(/\n{3,}/g, '\n\n')
    // Trim trailing spaces at the end of each line.
    .replace(/[ \t]+$/gm, '')
    .trim();
}

/**
 * Extract text from a PDF buffer.
 *
 * pdf-parse v2 exposes a class rather than the single function that older
 * tutorials show. By default it appends a "-- 1 of 2 --" marker to each page;
 * pageJoiner: '' turns that off, because those markers would otherwise end up
 * in the text we send to the ML service and to Gemini.
 */
async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  try {
    const result = await parser.getText({ pageJoiner: '' });
    return result.text ?? '';
  } finally {
    // Always release the worker, even if parsing threw, or the Node process
    // will not exit cleanly.
    await parser.destroy();
  }
}

/**
 * Extract text from a .docx buffer.
 *
 * extractRawText ignores styling entirely, which is what we want: the ML
 * service and Gemini both care about the words, not the formatting.
 */
async function extractDocxText(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? '';
}

/**
 * Extract plain text from an uploaded resume.
 *
 * @param {{buffer: Buffer, originalname: string, mimetype: string, size: number}} file
 *   a multer file object held in memory
 * @returns {Promise<{text: string, characters: number, format: string}>}
 * @throws {Error} with a message written for the person who uploaded the file
 */
async function extractResumeText(file) {
  if (!file || !file.buffer) {
    throw new Error('No file was uploaded. Attach a PDF or DOCX file in the "resume" field.');
  }

  const name = file.originalname || 'upload';
  const lowerName = name.toLowerCase();
  const extension = lowerName.slice(lowerName.lastIndexOf('.'));

  // Old binary .doc is a completely different format that mammoth cannot read.
  // Saying so beats letting it fail with an unreadable zip error.
  if (extension === '.doc') {
    throw new Error(
      'Old .doc files are not supported. Open it in Word and save as .docx, or export it as a PDF.'
    );
  }

  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    throw new Error(
      `Unsupported file type "${extension || name}". Upload a PDF or DOCX file, or paste your resume as text.`
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`That file is larger than ${MAX_FILE_BYTES / 1024 / 1024}MB. Upload a smaller file.`);
  }

  let rawText;
  try {
    rawText = extension === '.pdf' ? await extractPdfText(file.buffer) : await extractDocxText(file.buffer);
  } catch (error) {
    // The underlying libraries throw technical errors ("Invalid PDF structure",
    // zip errors for a renamed file). Translate rather than forward them.
    console.error(`Resume extraction failed for ${name}: ${error.message}`);
    throw new Error(
      `Could not read "${name}". The file may be corrupt, password protected, or not really a ${extension.slice(1).toUpperCase()}.`
    );
  }

  const text = normaliseWhitespace(rawText);

  if (text.length < MIN_USEFUL_CHARACTERS) {
    throw new Error(
      `Almost no text could be read from "${name}". If it is a scanned image, paste your resume as text instead.`
    );
  }

  return {
    text,
    characters: text.length,
    format: extension.slice(1),
  };
}

module.exports = {
  extractResumeText,
  normaliseWhitespace,
  MAX_FILE_BYTES,
  SUPPORTED_EXTENSIONS,
};
