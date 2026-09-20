import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import MatchPage from './pages/MatchPage';
import CandidatesPage from './pages/CandidatesPage';
import CheckResumePage from './pages/CheckResumePage';

/**
 * App shell: the navbar plus whichever page the current URL maps to.
 *
 * The landing page is the exception - it is the front door, with its own
 * header and its own two entry points, so the app navbar would just be a
 * second competing set of links above it.
 */
function App() {
  const { pathname } = useLocation();
  const isLanding = pathname === '/';

  if (isLanding) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8">
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
    </div>
  );
}

export default App;
