/**
 * The button, in three variants.
 *
 * Before this, every page wrote its own class string. They agreed on the
 * tokens - aubergine, 10px radius, the type scale - but drifted on everything
 * else: px-3 py-1.5 here, px-5 py-2.5 there, disabled styles on some and not
 * others. Same design, different implementations, which is exactly the kind of
 * inconsistency that reads as unfinished.
 *
 *   primary   - the one action a screen wants you to take. Filled aubergine.
 *   secondary - an equal-weight alternative. Outlined, warms to primary.
 *   ghost     - tertiary. No border until hovered.
 *
 * Focus rings are defined here rather than per call site, using focus-visible
 * so they appear for keyboard users without putting a ring around every button
 * a mouse happens to click.
 */

const VARIANTS = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 disabled:bg-ink-300 disabled:text-white',
  secondary:
    'border border-ink-300 bg-white text-ink-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 disabled:border-ink-200 disabled:text-ink-400',
  ghost:
    'text-ink-600 hover:bg-ink-100 hover:text-ink-900 disabled:text-ink-300',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-meta',
  md: 'px-4 py-2 text-meta',
  lg: 'px-5 py-2.5 text-meta',
};

function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const base = [
    'inline-flex items-center justify-center gap-2 rounded-ui font-semibold',
    // 150ms, matching the cards and nav links elsewhere.
    'transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed',
  ].join(' ');

  return (
    <button
      type={type}
      className={`${base} ${VARIANTS[variant] ?? VARIANTS.primary} ${SIZES[size] ?? SIZES.md} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
