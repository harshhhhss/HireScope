const axios = require('axios');
const { toPlainText } = require('./jobSearchService');

/**
 * Lever-hosted job boards.
 *
 * Same public, keyless pattern as Greenhouse, and the reason it is here at all
 * is that most of the mid-size Indian firms worth checking turned out not to
 * use Greenhouse. Of the ten probed - Tiger Analytics, LatentView, Fractal,
 * Mu Sigma, Media.net, Meesho, Uber, Swiggy, Zomato and Udaan - exactly one
 * has a live public board, so this file currently serves Meesho alone.
 *
 * Lever is friendlier than Greenhouse in one respect: the board response
 * already contains `descriptionPlain`, so there is no second request and no
 * HTML to strip.
 */

const LEVER_BASE = 'https://api.lever.co/v0/postings';
const REQUEST_TIMEOUT_MS = 20000;
const MAX_RESULTS = 20;

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map();

function readCache(slug) {
  const hit = cache.get(slug);
  if (!hit) return null;

  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(slug);
    return null;
  }

  return hit.postings;
}

/**
 * Lever splits a posting into an opening blurb, the body, and trailing
 * sections. The body carries the requirements, so all three are joined - the
 * opening alone is company boilerplate.
 */
function buildDescription(posting) {
  const parts = [
    posting.openingPlain,
    posting.descriptionPlain || posting.description,
    posting.additionalPlain,
  ].filter(Boolean);

  return toPlainText(parts.join('\n\n'));
}

/**
 * Search one Lever board.
 *
 * @returns {Promise<object[]>} empty if the shape is unfamiliar
 */
async function searchLeverJobs(boardSlug, companyName, keywords = '', location = '') {
  let postings = readCache(boardSlug);

  if (!postings) {
    const response = await axios.get(`${LEVER_BASE}/${boardSlug}`, {
      params: { mode: 'json' },
      timeout: REQUEST_TIMEOUT_MS,
    });

    if (!Array.isArray(response.data)) {
      console.error(`Lever ${boardSlug}: unexpected response shape. Falling back.`);
      return [];
    }

    postings = response.data;
    cache.set(boardSlug, { at: Date.now(), postings });
  }

  const wantedTerms = keywords.toLowerCase().split(/\s+/).filter(Boolean);
  const wantedLocation = location.trim().toLowerCase();

  const matches = postings.filter((posting) => {
    const title = (posting.text || '').toLowerCase();
    const where = ((posting.categories || {}).location || '').toLowerCase();

    const titleMatches = wantedTerms.length === 0 || wantedTerms.every((term) => title.includes(term));
    const locationMatches = !wantedLocation || where.includes(wantedLocation);

    return titleMatches && locationMatches;
  });

  return matches.slice(0, MAX_RESULTS).map((posting) => {
    const description = buildDescription(posting);

    return {
      id: String(posting.id ?? ''),
      title: toPlainText(posting.text) || 'Untitled role',
      company: companyName,
      location: toPlainText((posting.categories || {}).location) || '',
      snippet: description.length > 220 ? `${description.slice(0, 220)}...` : description,
      description,
      url: posting.hostedUrl || posting.applyUrl || '',
      created: posting.createdAt ?? null,
      source: 'lever',
      // Lever ships the body with the listing, so nothing further to fetch.
      needs_detail: false,
    };
  });
}

module.exports = { searchLeverJobs, buildDescription };
