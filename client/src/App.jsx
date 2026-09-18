import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import MatchPage from './pages/MatchPage';
import CandidatesPage from './pages/CandidatesPage';
import CheckResumePage from './pages/CheckResumePage';

/**
 * App shell: the navbar plus whichever page the current URL maps to.
 */
function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<MatchPage />} />
          <Route path="/candidates" element={<CandidatesPage />} />
          {/* Self-service flow: one person checking their own resume. */}
          <Route path="/check-resume" element={<CheckResumePage />} />
          {/* Anything else falls through to a plain not-found message. */}
          <Route
            path="*"
            element={<p className="text-sm text-slate-500">Page not found.</p>}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
