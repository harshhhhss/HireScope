/**
 * A short history of resume scores, kept in the browser.
 *
 * Deliberately not on the server. There is no auth in HireScope, so a
 * server-side history would be keyed to nothing and shared by everyone who
 * opened the app. localStorage is scoped to exactly the right thing here: one
 * student, one browser, their own checks.
 *
 * Every read and write is wrapped, because localStorage is not guaranteed to
 * exist. In private browsing, with site data blocked, or inside some embedded
 * webviews, touching it throws rather than returning null. The rule in this
 * file is that storage failing is never an error the user has to see - the
 * progress section simply does not appear.
 */

const STORAGE_KEY = 'hirescope_resume_history';

// Ten is enough to show a trend without letting the entry grow unbounded.
const MAX_ENTRIES = 10;

/**
 * Read the saved history, newest last.
 * @returns {Array<{timestamp: number, overall_score: number}>} empty if unavailable
 */
export function readHistory() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Anything malformed is dropped rather than trusted: this data has been
    // sitting in a browser we do not control and may be from an older version.
    return parsed
      .filter(
        (entry) =>
          entry &&
          typeof entry.overall_score === 'number' &&
          Number.isFinite(entry.overall_score) &&
          typeof entry.timestamp === 'number'
      )
      .slice(-MAX_ENTRIES);
  } catch (error) {
    return [];
  }
}

/**
 * Append one score and return the updated history.
 *
 * Returns the new list so the caller can render immediately without a second
 * read. If storage is unavailable the score is still returned in-memory, so the
 * current session shows a trend even though nothing was persisted.
 *
 * @param {number} score
 * @returns {Array<{timestamp: number, overall_score: number}>}
 */
export function appendScore(score) {
  const entry = { timestamp: Date.now(), overall_score: score };
  const next = [...readHistory(), entry].slice(-MAX_ENTRIES);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    // Quota exceeded, storage disabled, private mode. Nothing to do: the
    // caller still gets `next` and the UI still works for this session.
  }

  return next;
}

/** Remove the saved history. Used by the "clear" control. */
export function clearHistory() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Same as above - if we cannot clear it, there was nothing readable anyway.
  }
  return [];
}

/**
 * Work out what to say about the newest score versus the one before it.
 *
 * @param {Array<{overall_score: number}>} history newest last
 * @returns {{label: string, direction: 'up'|'down'|'same'|'first'}}
 */
export function describeChange(history) {
  if (!history || history.length < 2) {
    return { label: 'Your first check', direction: 'first' };
  }

  const latest = history[history.length - 1].overall_score;
  const previous = history[history.length - 2].overall_score;
  const delta = Math.round((latest - previous) * 10) / 10;

  if (delta === 0) return { label: 'No change since your last check', direction: 'same' };

  return {
    label: `${delta > 0 ? '+' : ''}${delta} since your last check`,
    direction: delta > 0 ? 'up' : 'down',
  };
}
