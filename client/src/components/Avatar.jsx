/**
 * A candidate's initials in a coloured circle.
 *
 * Gives each row an anchor the eye can find, which a column of plain names
 * does not have. The colour is derived from the name rather than random or
 * sequential, so the same person is always the same colour - across pages,
 * across reloads, and after the list is re-sorted by a new match.
 *
 * The palette is drawn from primary and accent only. Status colours are
 * excluded on purpose: a green avatar beside an amber score would read as a
 * second, contradicting verdict.
 */

const TONES = [
  'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-200',
  'bg-accent-100 text-accent-700 dark:bg-accent-900/50 dark:text-accent-200',
  'bg-primary-600 text-white dark:bg-primary-700',
  'bg-accent-600 text-white dark:bg-accent-700',
  'bg-ink-200 text-ink-700 dark:bg-ink-800 dark:text-ink-200',
];

function initialsOf(name) {
  const words = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** A tiny deterministic hash, so a name always lands on the same tone. */
function toneFor(name) {
  const text = String(name || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 100000;
  }
  return TONES[hash % TONES.length];
}

function Avatar({ name, className = 'h-10 w-10' }) {
  return (
    <span
      aria-hidden="true"
      className={`${className} ${toneFor(name)} inline-flex shrink-0 items-center justify-center rounded-full font-display text-meta font-semibold`}
    >
      {initialsOf(name)}
    </span>
  );
}

export default Avatar;
