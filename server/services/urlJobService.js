const axios = require('axios');
const { load } = require('cheerio');
const { toPlainText } = require('./jobSearchService');

/**
 * Extract a job posting from any URL the user pastes.
 *
 * The catch-all for the long tail. Adzuna, Greenhouse, Lever and Amazon cover
 * a handful of employers between them; this covers anything else, as long as
 * the page ships its text in the HTML. Google Careers does, for example - an
 * individual job page serves about 11,000 characters of readable text with
 * the qualifications fully present.
 *
 * What it deliberately does NOT do is render JavaScript. A single-page job
 * board returns an empty shell, and this reports that plainly rather than
 * pretending. Headless-browser rendering is a much heavier and more brittle
 * piece of work, and is not attempted here.
 */

const REQUEST_TIMEOUT_MS = 20000;

// Job pages are text. Anything past this is a download, not a posting.
const MAX_BYTES = 3 * 1024 * 1024;

// Below this, extraction has effectively failed - a JS shell, a login wall,
// or a consent page. Real postings run to thousands of characters.
const MIN_USEFUL_CHARACTERS = 400;

// Chrome's UA. Several career sites serve a stripped page or a challenge to
// anything that announces itself as a script.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Removed outright: none of it is ever part of a job description.
const CHROME_SELECTORS = [
  'script', 'style', 'noscript', 'iframe', 'svg', 'form',
  'nav', 'header', 'footer', 'aside',
  '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
  '[aria-hidden="true"]',
  '.nav', '.navbar', '.menu', '.header', '.footer', '.sidebar',
  '.cookie', '.cookies', '.consent', '.banner', '.breadcrumb',
];

/**
 * Only http(s), and no obvious internal addresses.
 *
 * The server fetches whatever URL it is handed, so without this the endpoint
 * is a way to make it request things on its own network - the classic
 * server-side request forgery shape. This is a basic guard, not a complete
 * SSRF defence; a deployment exposed to untrusted users would want an
 * allowlist and DNS resolution checks on top.
 */
function assertSafeUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (error) {
    throw new Error('That does not look like a valid URL.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https links are supported.');
  }

  const host = parsed.hostname.toLowerCase();
  const isLocal =
    host === 'localhost' ||
    host === '::1' ||
    host.endsWith('.local') ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);

  if (isLocal) {
    throw new Error('That URL points at a private address.');
  }

  return parsed;
}

// Headings that label the page rather than name the role. Google Careers, for
// instance, uses an <h1> of "job details" and puts the real title in og:title.
const GENERIC_HEADINGS = /^(job|career|position|vacancy)?\s*(details?|description|opening|posting|search)$/i;

/**
 * The page title.
 *
 * og:title first: it is the one a site fills in deliberately for sharing, and
 * on real job pages it is the role name. The <h1> is checked next but skipped
 * when it is a generic label, and the tab title last, since it usually trails
 * the company name behind a separator.
 */
function extractTitle($) {
  const ogTitle = toPlainText($('meta[property="og:title"]').attr('content') || '');
  if (ogTitle.length > 2) return ogTitle.slice(0, 200);

  const heading = toPlainText($('h1').first().text() || '');
  if (heading.length > 2 && !GENERIC_HEADINGS.test(heading)) return heading.slice(0, 200);

  const tabTitle = toPlainText($('title').first().text() || '');
  if (tabTitle.length > 2) {
    // "Role — Company" and "Role | Company" are both common; keep the role.
    return tabTitle.split(/\s+[—|–·]\s+/)[0].slice(0, 200);
  }

  return heading.length > 2 ? heading.slice(0, 200) : 'Job posting';
}

/**
 * Find the block of the page that actually holds the posting.
 *
 * A readability-style heuristic rather than a parser: score every candidate
 * container by how much text it holds, and take the densest one. Real article
 * extraction weighs link density and tag types too, but for job pages - which
 * are one long block of prose - size alone gets it right most of the time.
 *
 * Falls back to the whole body, because a page with unusual markup is better
 * served by too much text than none.
 */
function extractBody($) {
  const candidates = [];

  // Semantic containers first, then the generic ones job sites tend to use.
  $('article, main, [role="main"], section, div').each((_, element) => {
    const text = $(element).text().replace(/\s+/g, ' ').trim();
    if (text.length >= MIN_USEFUL_CHARACTERS) {
      candidates.push({ element, length: text.length, text });
    }
  });

  if (candidates.length === 0) {
    return $('body').text().replace(/\s+/g, ' ').trim();
  }

  // Sorting by length alone would always pick the outermost wrapper, since it
  // contains every child. Prefer the SMALLEST block still holding most of the
  // text - that is the posting itself rather than the page around it.
  const largest = Math.max(...candidates.map((c) => c.length));
  const tightest = candidates
    .filter((c) => c.length >= largest * 0.6)
    .sort((a, b) => a.length - b.length)[0];

  return tightest.text;
}

/**
 * Fetch a job page and pull out its title and description.
 *
 * @param {string} rawUrl
 * @returns {Promise<{title: string, description: string, characters: number, url: string}>}
 * @throws {Error} with a message written for the person who pasted the link
 */
async function extractJobFromUrl(rawUrl) {
  const parsed = assertSafeUrl(rawUrl);

  let html;
  try {
    const response = await axios.get(parsed.toString(), {
      timeout: REQUEST_TIMEOUT_MS,
      maxContentLength: MAX_BYTES,
      maxRedirects: 5,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      // Read the body ourselves so a non-HTML response can be reported clearly.
      responseType: 'text',
      transformResponse: [(data) => data],
    });

    const contentType = String(response.headers['content-type'] || '');
    if (!contentType.includes('html')) {
      throw new Error('That link is not a web page.');
    }

    html = response.data;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 404) throw new Error('That page was not found - the posting may have closed.');
      if (status === 403 || status === 401) {
        throw new Error('That site blocked the request. Copy the description and paste it instead.');
      }
      throw new Error(`That page returned ${status}.`);
    }
    if (error.code === 'ECONNABORTED') throw new Error('That page took too long to respond.');
    // A thrown Error from the checks above has a message worth keeping.
    if (error.message && !error.code) throw error;
    throw new Error(`Could not load that page: ${error.message}`);
  }

  const $ = load(html);
  $(CHROME_SELECTORS.join(',')).remove();

  const title = extractTitle($);
  const description = toPlainText(extractBody($));

  if (description.length < MIN_USEFUL_CHARACTERS) {
    // The honest failure. Sites that build the page in the browser land here,
    // and no amount of better heuristics would change that.
    throw new Error(
      'Could not extract the description from that page - it likely builds its content in the browser. Copy the job text and paste it into the box instead.'
    );
  }

  return {
    title,
    description,
    characters: description.length,
    url: parsed.toString(),
  };
}

module.exports = { extractJobFromUrl, assertSafeUrl, extractTitle, extractBody };
