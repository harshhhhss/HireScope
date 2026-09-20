import { NavLink } from 'react-router-dom';
import { ScanSearch } from 'lucide-react';

/**
 * Top navigation. NavLink gives us an `isActive` flag so the current page can
 * be highlighted without any extra state.
 */
function Navbar() {
  const linkClass = ({ isActive }) =>
    `rounded-ui px-3 py-2 text-meta font-medium transition-colors ${
      isActive
        ? 'bg-primary-600 text-white'
        : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
    }`;

  return (
    <header className="border-b border-ink-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* The wordmark goes home, which is now the landing page. */}
        <NavLink to="/" className="flex items-center gap-2">
          <ScanSearch className="h-5 w-5 text-primary-600" aria-hidden="true" />
          <span className="text-heading text-ink-900">HireScope</span>
          <span className="hidden text-meta text-ink-400 sm:inline">
            Resume-to-job matching
          </span>
        </NavLink>

        <div className="flex gap-1">
          <NavLink to="/match" className={linkClass}>
            Match
          </NavLink>
          <NavLink to="/candidates" className={linkClass}>
            Candidates
          </NavLink>
          <NavLink to="/check-resume" className={linkClass}>
            Check my resume
          </NavLink>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
