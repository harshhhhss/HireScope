/**
 * Shared classes for text inputs, textareas and selects.
 *
 * A constant rather than a component: these three elements take different
 * props and children, and wrapping each in its own component to share one
 * class string would be more indirection than it saves.
 *
 * The focus treatment is the reason this is centralised. Every field should
 * announce focus the same way, and keyboard users depend on it - but it was
 * previously retyped at each call site, so some fields had the ring and some
 * had only a border change.
 */
export const fieldClass = [
  'w-full rounded-ui border border-ink-300 bg-white',
  'text-body text-ink-900 placeholder:text-ink-400',
  'transition-colors duration-150',
  'focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600',
  'disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-500',
].join(' ');

/** Single-line inputs and selects. */
export const inputClass = `${fieldClass} px-3 py-2`;

/** Multi-line textareas, which want a little more breathing room. */
export const textareaClass = `${fieldClass} p-3`;

/** A read-only field, for output the user copies rather than edits. */
export const readOnlyClass = `${textareaClass} bg-ink-50`;

/**
 * The keyboard focus ring, for interactive elements that are not <Button>.
 *
 * focus-visible rather than focus, so it appears for keyboard users without
 * ringing every element a mouse clicks. Defined once so the ring is identical
 * everywhere - an inconsistent focus style is worse than none, because it
 * makes the indicator harder to track as you tab.
 */
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2';
