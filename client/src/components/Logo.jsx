/**
 * The HireScope mark: two rounded shapes converging on a point.
 *
 * The product compares two documents and reports how close they sit, so the
 * mark is two forms overlapping - one aubergine, one indigo - with a solid dot
 * where they meet. The overlap uses multiply-style opacity rather than a third
 * flat colour, so the intersection is genuinely the two shapes combined.
 *
 * currentColor is deliberately not used: the mark is two-tone, and inheriting a
 * single text colour would flatten the whole idea.
 */
function Logo({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="HireScope">
      {/* Left form: the resume. */}
      <rect x="2" y="7" width="17" height="18" rx="5" className="fill-primary-600" opacity="0.92" />
      {/* Right form: the posting, overlapping it. */}
      <rect
        x="13"
        y="7"
        width="17"
        height="18"
        rx="5"
        className="fill-accent-600"
        opacity="0.78"
      />
      {/* The match itself, where the two agree. */}
      <circle cx="16" cy="16" r="3.1" className="fill-white" />
    </svg>
  );
}

export default Logo;
