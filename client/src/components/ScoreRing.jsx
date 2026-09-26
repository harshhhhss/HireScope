import { getScoreBand } from './FitScoreBadge';
import useCountUp from './useCountUp';

/**
 * A 0-100 score drawn as a circular progress ring.
 *
 * The bands come from getScoreBand() in FitScoreBadge, so a score means the
 * same thing everywhere in the app and the thresholds can only be changed in
 * one place.
 *
 * Built from two SVG circles: one faint track, and one arc on top whose length
 * is set with stroke-dasharray. Rotating the whole SVG -90 degrees moves the
 * starting point from 3 o'clock to 12 o'clock.
 */
function ScoreRing({ score, size = 168, label = 'Resume score' }) {
  const value = typeof score === 'number' && Number.isFinite(score) ? score : 0;
  const clamped = Math.min(100, Math.max(0, value));

  // The ring arc and the number are both driven by this, so the figure always
  // matches however much of the circle is drawn. Declared before the geometry
  // below, which reads it.
  const shown = useCountUp(clamped, 900);

  // Geometry. The radius is inset by half the stroke width so the thick line
  // does not get clipped by the edge of the SVG viewport.
  const strokeWidth = 12;
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (shown / 100) * circumference;

  const band = getScoreBand(clamped);

  // The ring shows resume quality, not a job match, so the wording differs
  // from the badge even though the thresholds and colours are shared.
  const captions = { 'Strong match': 'Strong', 'Partial match': 'Needs work', 'Weak match': 'Needs rewriting' };
  const caption = captions[band.caption];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          role="img"
          aria-label={`${label}: ${clamped} out of 100`}
        >
          {/* The track: the full circle, faint. */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="text-ink-200 dark:text-ink-800"
            stroke="currentColor"
          />

          {/* The value arc. strokeDasharray draws `filled` pixels of line then
              leaves the rest of the circumference blank. */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference - filled}`}
            className={band.stroke}
            stroke="currentColor"
          />
        </svg>

        {/* The number sits on top of the ring rather than inside the SVG, so it
            uses normal text rendering and stays selectable. */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Proportional figures: this number is the content of the card,
              not one of a column of numbers to be compared down the page. */}
          <span className={`text-display font-display ${band.text}`}>{Math.round(shown)}</span>
          <span className="text-label uppercase text-ink-400">out of 100</span>
        </div>
      </div>

      <span className={`mt-3 text-body font-semibold ${band.text}`}>{caption}</span>
    </div>
  );
}

export default ScoreRing;
