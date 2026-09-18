/**
 * A 0-100 score drawn as a circular progress ring.
 *
 * The colour bands are the same ones FitScoreBadge uses (70+ green, 40+ amber,
 * below that red) so a score means the same thing everywhere in the app.
 *
 * Built from two SVG circles: one faint track, and one arc on top whose length
 * is set with stroke-dasharray. Rotating the whole SVG -90 degrees moves the
 * starting point from 3 o'clock to 12 o'clock.
 */
function ScoreRing({ score, size = 168, label = 'Resume score' }) {
  const value = typeof score === 'number' && Number.isFinite(score) ? score : 0;
  const clamped = Math.min(100, Math.max(0, value));

  // Geometry. The radius is inset by half the stroke width so the thick line
  // does not get clipped by the edge of the SVG viewport.
  const strokeWidth = 12;
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (clamped / 100) * circumference;

  const bands = {
    strong: { stroke: 'text-green-500', text: 'text-green-700', caption: 'Strong' },
    fair: { stroke: 'text-amber-500', text: 'text-amber-700', caption: 'Needs work' },
    weak: { stroke: 'text-red-500', text: 'text-red-700', caption: 'Needs rewriting' },
  };

  let band = bands.weak;
  if (clamped >= 70) band = bands.strong;
  else if (clamped >= 40) band = bands.fair;

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
            className="text-slate-200"
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
            className={`${band.stroke} transition-[stroke-dasharray] duration-700 ease-out`}
            stroke="currentColor"
          />
        </svg>

        {/* The number sits on top of the ring rather than inside the SVG, so it
            uses normal text rendering and stays selectable. */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold tabular-nums ${band.text}`}>
            {Math.round(clamped)}
          </span>
          <span className="text-xs font-medium text-slate-400">out of 100</span>
        </div>
      </div>

      <span className={`mt-3 text-sm font-semibold ${band.text}`}>{band.caption}</span>
    </div>
  );
}

export default ScoreRing;
