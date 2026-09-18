import { NavLink } from 'react-router-dom';

/**
 * Top navigation. NavLink gives us an `isActive` flag so the current page can
 * be highlighted without any extra state.
 */
function Navbar() {
  const linkClass = ({ isActive }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-slate-900">HireScope</span>
          <span className="hidden text-sm text-slate-500 sm:inline">
            Resume-to-job matching
          </span>
        </div>

        <div className="flex gap-1">
          <NavLink to="/" className={linkClass} end>
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
