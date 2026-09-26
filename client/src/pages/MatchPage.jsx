import { useEffect, useState } from 'react';
import { getCandidates, matchCandidates } from '../services/api';
import JobDescriptionForm from '../components/JobDescriptionForm';
import ResultsTable from '../components/ResultsTable';
import CandidateDetailModal from '../components/CandidateDetailModal';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import TableSkeleton from '../components/TableSkeleton';
import { Target } from 'lucide-react';

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
        <h1 className="text-title font-display text-ink-900 dark:text-ink-100">Match candidates</h1>
        <p className="mt-2 text-body text-ink-500 dark:text-ink-400">
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
        // The API attaches the real reason to each candidate as `warning`, so
        // show that rather than guessing. A generic "check your API key" line
        // is actively misleading when four of five candidates succeeded - that
        // proves the key works, and the fifth just hit a transient rate limit.
        <Alert
          type="info"
          message={`Scores saved, but interview questions were unavailable for ${warnings.length} candidate(s): ${warnings
            .map((candidate) => `${candidate.email} (${candidate.warning})`)
            .join('; ')}`}
        />
      )}

      {hasMatched && (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <h2 className="text-heading font-display text-ink-900 dark:text-ink-100">
            Results ({results.length})
          </h2>
          <span className="text-meta text-ink-400">Ranked by fit score, best first</span>
        </div>
      )}

      {/* Matching runs an ML call and a Gemini call per candidate, so this is
          the longest wait in the app. A skeleton says work is happening; the
          empty state would wrongly say nothing has been asked for yet. */}
      {isMatching ? (
        <TableSkeleton rows={Math.min(candidateCount || 3, 5)} />
      ) : !hasMatched && results.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No results yet"
          description="Paste a job description above and run a match. Every candidate in the database will be scored against it and ranked here."
        />
      ) : (
        <div className="motion-safe:animate-fadeUp">
          <ResultsTable
            results={results}
            onSelectCandidate={setSelectedCandidate}
            emptyMessage="No candidates were scored."
          />
        </div>
      )}

      <CandidateDetailModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
}

export default MatchPage;
