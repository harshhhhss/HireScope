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
      text: 'text-good-ink',
      surface: 'bg-good-soft border-good-line',
      stroke: 'text-good',
    };
  }

  if (clamped >= 50) {
    return {
      value: clamped,
      caption: 'Partial match',
      text: 'text-warning-ink',
      surface: 'bg-warning-soft border-warning-line',
      stroke: 'text-warning',
    };
  }

  return {
    value: clamped,
    caption: 'Weak match',
    text: 'text-critical-ink',
    surface: 'bg-critical-soft border-critical-line',
    stroke: 'text-critical',
  };
}

function FitScoreBadge({ score, variant = 'compact' }) {
  const band = getScoreBand(score);

  if (variant === 'headline') {
    return (
      <div>
        <p className="text-label uppercase text-ink-400">Fit score</p>
        <div className="mt-1 flex items-baseline gap-2">
          {/* No tabular-nums: this figure stands alone, so proportional
              spacing reads better than column-aligned digits. */}
          <span className={`text-display ${band.text}`}>{band.value.toFixed(1)}</span>
          <span className="text-body text-ink-500">out of 100</span>
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
      <span className={`text-heading tabular-nums ${band.text}`}>{band.value.toFixed(1)}</span>
      <span className={`text-label uppercase ${band.text}`}>{band.caption}</span>
    </div>
  );
}

export default FitScoreBadge;
