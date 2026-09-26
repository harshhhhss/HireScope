import { useEffect, useRef, useState } from 'react';

/**
 * Count a number up to its value when it first appears.
 *
 * A score landing at its final figure is a hard cut; counting up draws the eye
 * to the one number on the screen that matters and reads as the result being
 * computed rather than retrieved.
 *
 * Driven by requestAnimationFrame against real elapsed time rather than a fixed
 * step per frame, so it takes the same duration on a 60Hz and a 144Hz display.
 * The easing is a cubic ease-out: fast at first, settling into the final value,
 * which is what makes it feel like it is arriving somewhere rather than just
 * ticking.
 *
 * Returns the target immediately for anyone who has asked for reduced motion.
 *
 * @param {number} target
 * @param {number} durationMs
 * @returns {number} the current value
 */
export function useCountUp(target, durationMs = 900) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const safeTarget = typeof target === 'number' && Number.isFinite(target) ? target : 0;
  const [value, setValue] = useState(prefersReducedMotion ? safeTarget : 0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(safeTarget);
      return undefined;
    }

    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);

      // Cubic ease-out.
      const eased = 1 - (1 - progress) ** 3;
      setValue(safeTarget * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        // Land exactly on the target; easing leaves a fractional remainder.
        setValue(safeTarget);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [safeTarget, durationMs, prefersReducedMotion]);

  return value;
}

export default useCountUp;
