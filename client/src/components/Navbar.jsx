import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

/**
 * Top navigation: sticky, with the background frosting once the page moves.
 *
 * The bar is transparent at the top of a page so the landing hero's gradient
 * runs behind it uninterrupted, then picks up a blurred, bordered background
 * as soon as content scrolls under it - which is what keeps the links readable
 * over whatever passes beneath.
 *
 * Three links plus the wordmark do not fit on a 375px screen, so below the sm
 * breakpoint they collapse behind a menu button and stack underneath the bar.
 * The links themselves are the same component in both layouts - only the
 * container changes - so the active state cannot drift between them.
 */
function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { pathname } = useLocation();

  // Navigating should close the menu. Without this it stays open over the page
  // you just moved to, which looks like the tap did nothing.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    // passive: this listener never calls preventDefault, and saying so lets the
    // browser scroll without waiting to find out.
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const linkClass = ({ isActive }) =>
    `rounded-ui px-3 py-2 text-meta font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-ink-975 ${
      isActive
        ? 'bg-primary-600 text-white shadow-card'
        : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100'
    }`;

  const links = (
    <>
      <NavLink to="/match" className={linkClass}>
        Match
      </NavLink>
      <NavLink to="/candidates" className={linkClass}>
        Candidates
      </NavLink>
      <NavLink to="/check-resume" className={linkClass}>
        Check my resume
      </NavLink>
    </>
  );

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 ${
        isScrolled || isMenuOpen
          ? 'border-b border-ink-200/80 bg-ink-50/80 backdrop-blur-md dark:border-ink-800/80 dark:bg-ink-975/80'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between gap-4 py-3">
          {/* The wordmark goes home, which is now the landing page. */}
          <NavLink
            to="/"
            className="flex items-center gap-2.5 rounded-ui transition-opacity duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-ink-975"
          >
            <Logo className="h-7 w-7 shrink-0" />
            <span className="font-display text-subheading tracking-tight text-ink-900 dark:text-ink-50">
              HireScope
            </span>
          </NavLink>

          <div className="flex items-center gap-1">
            {/* Full nav from sm upwards. */}
            <div className="hidden gap-1 sm:flex">{links}</div>

            <ThemeToggle />

            {/* Below sm, one button instead of three links. */}
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              className="rounded-ui p-2 text-ink-600 transition-colors duration-150 hover:bg-ink-100 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100 dark:focus-visible:ring-offset-ink-975 sm:hidden"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div
            id="mobile-nav"
            className="flex flex-col gap-1 border-t border-ink-200 py-2 dark:border-ink-800 sm:hidden"
          >
            {links}
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
