const axios = require('axios');

/**
 * Client for the Adzuna job search API.
 *
 * The credentials stay on this side of the wire. Adzuna keys are tied to an
 * account and rate limited, so putting them in the browser would both expose
 * them and let anyone burn the quota. The client asks our API; our API asks
 * Adzuna.
 *
 * Register for free keys at https://developer.adzuna.com/
 */

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;

// Adzuna namespaces results by country. "in" is India.
const COUNTRY = process.env.ADZUNA_COUNTRY || 'in';
const ADZUNA_URL = `https://api.adzuna.com/v1/api/jobs/${COUNTRY}/search/1`;

const REQUEST_TIMEOUT_MS = 15000;
const DEFAULT_RESULTS = 10;
const MAX_RESULTS = 20;

/** Whether the service is configured at all. Lets callers hide the feature. */
function isConfigured() {
  return Boolean(ADZUNA_APP_ID && ADZUNA_APP_KEY);
}

/**
 * Adzuna returns descriptions with HTML entities and tags in them. The text
 * goes into a textarea and then to the ML service and Gemini, so strip it.
 */
function toPlainText(value) {
  if (typeof value !== 'string') return '';

  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Search Adzuna for openings.
 *
 * @param {string} keywords - free text, e.g. "backend developer"
 * @param {string} [location] - e.g. "Chennai"
 * @param {number} [limit]
 * @returns {Promise<Array<{id,title,company,location,snippet,description,url,created}>>}
 */
async function searchJobs(keywords, location = '', limit = DEFAULT_RESULTS) {
  if (!isConfigured()) {
    throw new Error(
      'Job search is not configured. Add ADZUNA_APP_ID and ADZUNA_APP_KEY to server/.env - free keys at https://developer.adzuna.com/'
    );
  }

  try {
    const response = await axios.get(ADZUNA_URL, {
      params: {
        app_id: ADZUNA_APP_ID,
        app_key: ADZUNA_APP_KEY,
        what: keywords,
        // Adzuna ignores an empty where, so only send it when we have one.
        ...(location ? { where: location } : {}),
        results_per_page: Math.min(Math.max(1, limit), MAX_RESULTS),
        'content-type': 'application/json',
      },
      timeout: REQUEST_TIMEOUT_MS,
    });

    const results = Array.isArray(response.data?.results) ? response.data.results : [];

    // Trim to what the UI and the match flow actually need. The full
    // description is kept because it is what gets scored against the resume.
    return results.map((job) => {
      const description = toPlainText(job.description);

      return {
        id: String(job.id ?? ''),
        title: toPlainText(job.title) || 'Untitled role',
        company: toPlainText(job.company?.display_name) || 'Unknown company',
        location: toPlainText(job.location?.display_name) || '',
        snippet: description.length > 220 ? `${description.slice(0, 220)}...` : description,
        description,
        url: job.redirect_url ?? '',
        created: job.created ?? null,
      };
    });
  } catch (error) {
    if (error.response) {
      const status = error.response.status;

      // 401/403 means the keys are wrong, which is a configuration problem the
      // operator can fix - say so rather than reporting a generic failure.
      if (status === 401 || status === 403) {
        throw new Error(
          'Adzuna rejected the credentials. Check ADZUNA_APP_ID and ADZUNA_APP_KEY in server/.env'
        );
      }
      if (status === 429) {
        throw new Error('Adzuna rate limit reached. Try again in a minute.');
      }
      throw new Error(`Adzuna returned ${status}`);
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('Adzuna took too long to respond. Try again.');
    }

    throw new Error(`Job search failed: ${error.message}`);
  }
}

module.exports = { searchJobs, isConfigured, toPlainText };
