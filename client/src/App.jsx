import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import MatchPage from './pages/MatchPage';
import CandidatesPage from './pages/CandidatesPage';
import CheckResumePage from './pages/CheckResumePage';

/**
 * App shell: the navbar plus whichever page the current URL maps to.
 *
 * The navbar now shows on every route including the landing page. It used to be
 * hidden there because a solid bar competed with the hero - but it is
 * transparent until the page scrolls, so it no longer does, and keeping it
 * means the theme toggle is reachable from the front door.
 *
 * The landing page renders its own full-bleed background, so it sits outside
 * the centred <main> that the app pages share.
 */
function App() {
  const { pathname } = useLocation();
  const isLanding = pathname === '/';

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-975">
      <Navbar />

      {isLanding ? (
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      ) : (
        <main className="mx-auto max-w-6xl px-4 py-10">
          <Routes>
            {/* Recruiter flow. This used to live at "/", which is now the landing page. */}
            <Route path="/match" element={<MatchPage />} />
            <Route path="/candidates" element={<CandidatesPage />} />
            {/* Self-service flow: one person checking their own resume. */}
            <Route path="/check-resume" element={<CheckResumePage />} />
            {/* Anything else falls through to a plain not-found message. */}
            <Route
              path="*"
              element={<p className="text-body text-ink-500">Page not found.</p>}
            />
          </Routes>
        </main>
      )}
    </div>
  );
}

export default App;
