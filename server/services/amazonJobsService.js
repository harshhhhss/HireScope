const axios = require('axios');
const { toPlainText } = require('./jobSearchService');

/**
 * Amazon's own job search, via the open JSON endpoint behind amazon.jobs.
 *
 * It needs no key, and amazon.jobs/robots.txt only disallows /internal paths,
 * so /en/search.json is fair game.
 *
 * Two things about this endpoint are worth knowing, both established by
 * checking real responses rather than reading docs:
 *
 *   1. `location=India` is silently ignored. Passing it returns Redmond and
 *      Bellevue jobs with a hit count identical to an unfiltered search. The
 *      parameter that actually filters is `normalized_country_code[]`.
 *   2. Unlike Greenhouse, the search response already contains the full
 *      description, so there is no second request to make for the body.
 */

const AMAZON_SEARCH_URL = 'https://www.amazon.jobs/en/search.json';
const REQUEST_TIMEOUT_MS = 20000;
const MAX_RESULTS = 20;

// Amazon returns 3-letter codes. India is the only market this app targets.
const COUNTRY_CODE = 'IND';

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map();

function cacheKey(keywords) {
  return keywords.trim().toLowerCase();
}

function readCache(key) {
  const hit = cache.get(key);
  if (!hit) return null;

  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return hit.jobs;
}

/**
 * Join the description with the qualifications.
 *
 * Amazon splits a posting across three fields, and the qualifications are the
 * part that actually lists technologies - dropping them would hand the skills
 * matcher the marketing copy and none of the requirements.
 */
function buildDescription(job) {
  const parts = [
    job.description,
    job.basic_qualifications && `Basic qualifications: ${job.basic_qualifications}`,
    job.preferred_qualifications && `Preferred qualifications: ${job.preferred_qualifications}`,
  ].filter(Boolean);

  // The fields carry <br/> markup and HTML entities; toPlainText handles both.
  return toPlainText(parts.join('\n\n'));
}

/**
 * Search Amazon's India openings.
 *
 * `location` is applied here rather than upstream: neither `city[]` nor a
 * city name inside `query` filters anything, so the only reliable way to
 * narrow to Chennai is to match on the location text we get back.
 *
 * @returns {Promise<object[]>} empty array if the response shape is unfamiliar
 */
async function searchAmazonJobs(keywords, location = '') {
  const key = cacheKey(keywords);
  let jobs = readCache(key);

  if (!jobs) {
    const response = await axios.get(AMAZON_SEARCH_URL, {
      params: {
        query: keywords,
        'normalized_country_code[]': COUNTRY_CODE,
        result_limit: 50,
      },
      // Amazon serves a challenge page to obviously scripted clients.
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HireScope/1.0)' },
      timeout: REQUEST_TIMEOUT_MS,
    });

    // If Amazon changes the response shape this returns nothing rather than
    // throwing, so the caller can fall back to another source instead of the
    // whole request failing.
    if (!Array.isArray(response.data?.jobs)) {
      console.error('Amazon jobs: unexpected response shape, no `jobs` array. Falling back.');
      return [];
    }

    jobs = response.data.jobs;
    cache.set(key, { at: Date.now(), jobs });
  }

  const wantedLocation = location.trim().toLowerCase();

  const matches = wantedLocation
    ? jobs.filter((job) =>
        `${job.location ?? ''} ${job.city ?? ''}`.toLowerCase().includes(wantedLocation)
      )
    : jobs;

  return matches.slice(0, MAX_RESULTS).map((job) => {
    const description = buildDescription(job);

    return {
      id: String(job.id_icims ?? job.id ?? ''),
      title: toPlainText(job.title) || 'Untitled role',
      company: 'Amazon',
      location: toPlainText(job.location) || toPlainText(job.city) || '',
      snippet: description.length > 220 ? `${description.slice(0, 220)}...` : description,
      description,
      url: job.job_path ? `https://www.amazon.jobs${job.job_path}` : 'https://www.amazon.jobs',
      created: job.posted_date ?? null,
      source: 'amazon',
      // The body is already here, so the client never needs a detail call.
      needs_detail: false,
    };
  });
}

module.exports = { searchAmazonJobs, buildDescription };
