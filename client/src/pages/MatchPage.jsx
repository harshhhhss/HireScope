import { useEffect, useState } from 'react';
import { getCandidates, matchCandidates } from '../services/api';
import JobDescriptionForm from '../components/JobDescriptionForm';
import ResultsTable from '../components/ResultsTable';
import CandidateDetailModal from '../components/CandidateDetailModal';
import Alert from '../components/Alert';

/**
 * The main screen: paste a job description, score every candidate against it,
 * read the ranked results.
 */
function MatchPage() {
  const [candidateCount, setCandidateCount] = useState(0);
  const [results, setResults] = useState([]);
  const [failures, setFailures] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState('');
  const [hasMatched, setHasMatched] = useState(false);

  // Load the candidate count once on mount so the form can tell the user
  // whether there is anything to match against.
  useEffect(() => {
    let cancelled = false;

    getCandidates()
      .then((candidates) => {
        if (!cancelled) setCandidateCount(candidates.length);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      });

    // If the component unmounts before the request lands, skip the setState.
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleMatch(jobDescription) {
    setIsMatching(true);
    setError('');
    setFailures([]);

    try {
      const response = await matchCandidates(jobDescription);
      setResults(response.results);
      setFailures(response.failures);
      setHasMatched(true);
    } catch (matchError) {
      setError(matchError.message);
    } finally {
      // finally runs whether the request succeeded or threw, so the button
      // never gets stuck on "Matching...".
      setIsMatching(false);
    }
  }

  // Candidates whose scores saved but whose questions did not (Gemini failed).
  const warnings = results.filter((candidate) => candidate.warning);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Match candidates</h1>
        <p className="mt-1 text-sm text-slate-500">
          Scores come from sentence embeddings; the skills lists come from a
          keyword taxonomy; the questions come from Gemini.
        </p>
      </div>

      <Alert type="error" message={error} onDismiss={() => setError('')} />

      <JobDescriptionForm
        onSubmit={handleMatch}
        isMatching={isMatching}
        candidateCount={candidateCount}
      />

      {failures.length > 0 && (
        <Alert
          type="error"
          message={`${failures.length} candidate(s) could not be scored: ${failures
            .map((failure) => `${failure.email} (${failure.error})`)
            .join('; ')}`}
        />
      )}

      {warnings.length > 0 && (
        <Alert
          type="info"
          message={`Scores saved, but interview questions were unavailable for ${warnings.length} candidate(s). Check that GEMINI_API_KEY is set in server/.env.`}
        />
      )}

      {hasMatched && (
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Results ({results.length})
          </h2>
          <span className="text-xs text-slate-500">Ranked by fit score, best first</span>
        </div>
      )}

      <ResultsTable
        results={results}
        onSelectCandidate={setSelectedCandidate}
        emptyMessage={
          hasMatched
            ? 'No candidates were scored.'
            : 'Paste a job description above and run a match to see results here.'
        }
      />

      <CandidateDetailModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
}

export default MatchPage;
