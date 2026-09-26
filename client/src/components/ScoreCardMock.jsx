/**
 * A static, non-functional mock of the score card, for the hero.
 *
 * Shows the product rather than describing it. Deliberately not the real
 * ScoreRing: that component takes live data, animates, and carries band logic,
 * none of which belongs on a marketing page. This is a picture of the output,
 * hard-coded, and marked aria-hidden so a screen reader gets the headline
 * rather than a fake result read out as if it were real.
 */
function ScoreCardMock() {
  // Geometry for the ring arc. 78 of 100 at a strong-match green.
  const size = 132;
  const stroke = 11;
  const radius = size / 2 - stroke / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * 0.78;

  const matched = ['Python', 'Docker', 'AWS', 'MongoDB'];
  const missing = ['Kubernetes', 'CI/CD'];

  return (
    <div
      aria-hidden="true"
      className="w-full max-w-sm rounded-panel border border-ink-200/80 bg-white/90 p-6 shadow-panel backdrop-blur-sm dark:border-ink-800 dark:bg-ink-950/90"
    >
      <div className="flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              className="text-ink-200 dark:text-ink-800"
              stroke="currentColor"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circumference - filled}`}
              className="text-good"
              stroke="currentColor"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[2.5rem] font-bold leading-none text-good-ink dark:text-good-dark">
              78
            </span>
            <span className="text-label uppercase text-ink-400">out of 100</span>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-label uppercase text-ink-400">Fit score</p>
          <p className="font-display text-subheading text-ink-900 dark:text-ink-100">
            Strong match
          </p>
          <p className="mt-1 text-meta text-ink-500">Backend Engineer</p>
        </div>
      </div>

      <div className="mt-5 space-y-3 border-t border-ink-200 pt-4 dark:border-ink-800">
        <div>
          <p className="text-label uppercase text-ink-400">Matched</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {matched.map((skill) => (
              <span
                key={skill}
                className="rounded-ui border border-good-line bg-good-soft px-2 py-0.5 text-meta font-medium text-good-ink dark:border-good-dark/30 dark:bg-good-dark/10 dark:text-good-dark"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-label uppercase text-ink-400">Areas to develop</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {missing.map((skill) => (
              <span
                key={skill}
                className="rounded-ui border border-ink-300 px-2 py-0.5 text-meta font-medium text-ink-600 dark:border-ink-700 dark:text-ink-400"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScoreCardMock;
