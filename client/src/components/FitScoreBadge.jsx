import useCountUp from './useCountUp';

/**
 * The 0-100 fit score.
 *
 * Two presentations, same numbers:
 *   compact  - for the results table column and the modal header, where the
 *              score sits beside other data. Tabular figures, because these
 *              are stacked in a column and the digits should line up.
 *   headline - for when the score IS the content of the card. Large and
 *              proportional, because it is being read as a statement rather
 *              than scanned against the row above it.
 *
 * The band is always spelled out in words. Colour alone would leave the
 * meaning invisible to anyone who cannot separate the hues.
 */

/**
 * Thresholds live here so the ring, the table and the modal can never disagree.
 *
 * 75 is a deliberately high bar. Embedding similarity on real resumes clusters
 * in the 60s and low 70s, so "Strong match" stays rare enough to mean something
 * when it does appear.
 */
export function getScoreBand(score) {
  const value = typeof score === 'number' && Number.isFinite(score) ? score : 0;
  const clamped = Math.min(100, Math.max(0, value));

  if (clamped >= 75) {
    return {
      value: clamped,
      caption: 'Strong match',
      text: 'text-good-ink dark:text-good-dark',
      surface: 'bg-good-soft dark:bg-good-dark/10 border-good-line dark:border-good-dark/30',
      stroke: 'text-good',
    };
  }

  if (clamped >= 50) {
    return {
      value: clamped,
      caption: 'Partial match',
      text: 'text-warning-ink dark:text-warning-dark',
      surface: 'bg-warning-soft dark:bg-warning-dark/10 border-warning-line dark:border-warning-dark/30',
      stroke: 'text-warning',
    };
  }

  return {
    value: clamped,
    caption: 'Weak match',
    text: 'text-critical-ink dark:text-critical-dark',
    surface: 'bg-critical-soft dark:bg-critical-dark/10 border-critical-line dark:border-critical-dark/30',
    stroke: 'text-critical',
  };
}

function FitScoreBadge({ score, variant = 'compact' }) {
  const band = getScoreBand(score);
  // Only the headline counts up, and `shown` is used only there. In a table
  // column ten numbers animating at once would be noise rather than emphasis,
  // so the compact variant prints the final value directly.
  const shown = useCountUp(band.value, 900);

  if (variant === 'headline') {
    return (
      <div>
        <p className="text-label uppercase text-ink-400">Fit score</p>
        <div className="mt-1 flex items-baseline gap-2">
          {/* No tabular-nums: this figure stands alone, so proportional
              spacing reads better than column-aligned digits. */}
          <span className={`text-display font-display ${band.text}`}>{shown.toFixed(1)}</span>
          <span className="text-body text-ink-500 dark:text-ink-400">out of 100</span>
        </div>
        <p className={`text-meta font-medium ${band.text}`}>{band.caption}</p>
      </div>
    );
  }

  // No border or fill. Boxing every row's score turns a table column into a
  // stack of little cards; the band colour and the word already carry the
  // meaning, so the chrome is not earning its place.
  return (
    <div className="inline-flex flex-col">
      <span className={`text-heading font-display tabular-nums ${band.text}`}>{band.value.toFixed(1)}</span>
      <span className={`text-label uppercase ${band.text}`}>{band.caption}</span>
    </div>
  );
}

export default FitScoreBadge;
