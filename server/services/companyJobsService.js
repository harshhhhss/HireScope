const axios = require('axios');
const { toPlainText } = require('./jobSearchService');
const { searchAmazonJobs } = require('./amazonJobsService');
const { searchLeverJobs } = require('./leverJobsService');

/**
 * Job boards published directly by companies, via Greenhouse.
 *
 * This complements the Adzuna search rather than replacing it:
 *
 *   Adzuna     - broad search across the Indian market, including the large
 *                staffing and services employers. Short descriptions.
 *   Greenhouse - a named company's own board. Full postings, often several
 *                thousand characters, which is much better raw material for
 *                the fit score and the skills diff.
 *
 * Greenhouse's board API is public and needs no key, but there is no global
 * search across it: you query one company at a time, by its board token. That
 * is why the list below is curated rather than discovered - every token here
 * was verified to return a live board.
 *
 * Three providers sit behind one list, so the client only ever picks a company
 * and never has to know which ATS is underneath:
 *
 *   greenhouse - listing is cheap, body costs a second request
 *   lever      - listing already carries the body
 *   amazon     - amazon.jobs' own search endpoint, body included
 */

const GREENHOUSE_BASE = 'https://boards-api.greenhouse.io/v1/boards';
const REQUEST_TIMEOUT_MS = 20000;
const MAX_RESULTS = 20;

/**
 * Boards confirmed live. Indian-market employers are deliberately absent:
 * Flipkart, Zomato, Razorpay and Swiggy do not publish Greenhouse boards, so
 * Adzuna remains the route to those.
 */
const COMPANIES = [
  // Amazon first: of everything here it is the one that actually recruits at
  // Indian campuses in volume.
  { slug: 'amazon', name: 'Amazon (India)', provider: 'amazon' },
  // The single Lever board that survived probing ten mid-size Indian firms.
  { slug: 'meesho', name: 'Meesho', provider: 'lever', board: 'meesho' },
  { slug: 'stripe', name: 'Stripe', provider: 'greenhouse' },
  { slug: 'databricks', name: 'Databricks', provider: 'greenhouse' },
  { slug: 'anthropic', name: 'Anthropic', provider: 'greenhouse' },
  { slug: 'mongodb', name: 'MongoDB', provider: 'greenhouse' },
  { slug: 'cloudflare', name: 'Cloudflare', provider: 'greenhouse' },
  { slug: 'coinbase', name: 'Coinbase', provider: 'greenhouse' },
  { slug: 'gitlab', name: 'GitLab', provider: 'greenhouse' },
  { slug: 'robinhood', name: 'Robinhood', provider: 'greenhouse' },
  { slug: 'reddit', name: 'Reddit', provider: 'greenhouse' },
  { slug: 'figma', name: 'Figma', provider: 'greenhouse' },
  { slug: 'twilio', name: 'Twilio', provider: 'greenhouse' },
  { slug: 'duolingo', name: 'Duolingo', provider: 'greenhouse' },
];

/**
 * A board listing is ~0.4MB and changes slowly, so it is cached briefly.
 *
 * The same listing WITH descriptions is about 5MB, which is why this fetches
 * without them and pulls a single description on demand instead. Downloading
 * five megabytes so somebody can read three job titles would be absurd.
 */
const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map();

function readCache(slug) {
  const hit = cache.get(slug);
  if (!hit) return null;

  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(slug);
    return null;
  }

  return hit.jobs;
}

/** @returns {{slug: string, name: string}[]} the companies we can browse */
function listCompanies() {
  return COMPANIES;
}

function findCompany(slug) {
  return COMPANIES.find((company) => company.slug === slug);
}

/** Fetch (and cache) one company's board, without the heavy description bodies. */
async function fetchBoard(slug) {
  const cached = readCache(slug);
  if (cached) return cached;

  const response = await axios.get(`${GREENHOUSE_BASE}/${slug}/jobs`, {
    timeout: REQUEST_TIMEOUT_MS,
  });

  const jobs = Array.isArray(response.data?.jobs) ? response.data.jobs : [];
  cache.set(slug, { at: Date.now(), jobs });
  return jobs;
}

/**
 * Search one company's own board.
 *
 * Greenhouse has no query parameter, so filtering happens here over the title
 * and location. Results carry no description - the caller fetches that for the
 * one job the user actually picks, via getCompanyJobDescription().
 *
 * @returns {Promise<object[]>}
 */
async function searchCompanyJobs(slug, keywords = '', location = '') {
  const company = findCompany(slug);
  if (!company) {
    throw new Error(`Unknown company "${slug}". Call /api/v1/jobs/companies for the list.`);
  }

  // Amazon and Lever return the description with the listing, so they answer
  // here and never reach the Greenhouse path below.
  if (company.provider === 'amazon') {
    try {
      return await searchAmazonJobs(keywords, location);
    } catch (error) {
      console.error(`Amazon search failed: ${error.message}`);
      // An empty list lets the client fall back to another source rather than
      // failing the whole request.
      return [];
    }
  }

  if (company.provider === 'lever') {
    try {
      return await searchLeverJobs(company.board, company.name, keywords, location);
    } catch (error) {
      console.error(`Lever search failed for ${company.name}: ${error.message}`);
      return [];
    }
  }

  let jobs;
  try {
    jobs = await fetchBoard(slug);
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`${company.name} no longer publishes a public job board.`);
    }
    throw new Error(`Could not reach ${company.name}'s job board: ${error.message}`);
  }

  const wantedTerms = keywords.toLowerCase().split(/\s+/).filter(Boolean);
  const wantedLocation = location.trim().toLowerCase();

  const matches = jobs.filter((job) => {
    const title = (job.title || '').toLowerCase();
    const where = (job.location?.name || '').toLowerCase();

    // Every search word must appear in the title. Requiring all of them keeps
    // "backend engineer" from returning every role with "engineer" in it.
    const titleMatches = wantedTerms.length === 0 || wantedTerms.every((term) => title.includes(term));
    const locationMatches = !wantedLocation || where.includes(wantedLocation);

    return titleMatches && locationMatches;
  });

  return matches.slice(0, MAX_RESULTS).map((job) => ({
    id: String(job.id),
    title: toPlainText(job.title) || 'Untitled role',
    company: company.name,
    location: toPlainText(job.location?.name) || '',
    // Deliberately empty: the body is fetched separately, only when needed.
    snippet: '',
    description: '',
    url: job.absolute_url || '',
    created: job.updated_at || null,
    source: 'greenhouse',
    // Tells the client it must call the detail endpoint before it has text
    // worth matching against.
    needs_detail: true,
  }));
}

/**
 * Fetch the full description for one posting.
 *
 * @returns {Promise<{description: string, title: string, url: string}>}
 */
async function getCompanyJobDescription(slug, jobId) {
  const company = findCompany(slug);
  if (!company) {
    throw new Error(`Unknown company "${slug}".`);
  }

  // Only Greenhouse withholds the body from its listing; the others already
  // sent it, so asking for it again is a caller error worth naming.
  if (company.provider !== 'greenhouse') {
    throw new Error(`${company.name} listings already include the description.`);
  }

  try {
    const response = await axios.get(`${GREENHOUSE_BASE}/${slug}/jobs/${jobId}`, {
      timeout: REQUEST_TIMEOUT_MS,
    });

    const job = response.data ?? {};

    return {
      title: toPlainText(job.title) || 'Untitled role',
      url: job.absolute_url || '',
      // Greenhouse returns HTML with escaped entities; toPlainText handles both.
      description: toPlainText(job.content),
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('That posting is no longer listed - it may have been filled.');
    }
    throw new Error(`Could not load that posting: ${error.message}`);
  }
}

module.exports = { listCompanies, searchCompanyJobs, getCompanyJobDescription, COMPANIES };
