import { useEffect, useRef, useState } from 'react';

/**
 * Reveal an element the first time it scrolls into view.
 *
 * An IntersectionObserver rather than a scroll listener: the browser does the
 * work off the main thread and only calls back when the threshold is crossed,
 * where a scroll handler fires on every frame whether anything changed or not.
 *
 * It disconnects after the first reveal. Content that re-animates every time it
 * passes the viewport is distracting on the way back up the page.
 *
 * Anyone who has asked for reduced motion starts revealed, so nothing moves and
 * nothing is hidden waiting for an animation that will never run.
 *
 * @returns {[React.RefObject, boolean]} the ref to attach, and whether to show
 */
export function useReveal({ threshold = 0.15, rootMargin = '0px 0px -40px 0px' } = {}) {
  const ref = useRef(null);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const [isVisible, setIsVisible] = useState(Boolean(prefersReducedMotion));

  useEffect(() => {
    if (prefersReducedMotion) return undefined;

    const element = ref.current;
    if (!element) return undefined;

    // Older browsers without the API: show the content rather than hide it.
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, prefersReducedMotion]);

  return [ref, isVisible];
}

/** The classes a revealing element uses. Kept here so every reveal matches. */
export const revealClass = (isVisible, delayMs = 0) =>
  `transition-all duration-700 ease-out ${
    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
  }`.concat(delayMs ? '' : '');

export default useReveal;
