import { useEffect, useState } from 'react';
import { createCandidate, getCandidates } from '../services/api';
import CandidateForm from '../components/CandidateForm';
import ResultsTable from '../components/ResultsTable';
import CandidateDetailModal from '../components/CandidateDetailModal';
import Alert from '../components/Alert';

/**
 * Add candidates and review everyone already in the database, along with the
 * scores from whichever job description they were last matched against.
 */
function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadCandidates() {
    try {
      const data = await getCandidates();
      setCandidates(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCandidates();
  }, []);

  /**
   * Returns the saved candidate on success, or null on failure, so the form
   * knows whether it is safe to clear its inputs.
   */
  async function handleCreate(candidate) {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const saved = await createCandidate(candidate);
      setSuccess(`${saved.name} added.`);
      // Re-fetch rather than pushing onto local state, so the list always
      // reflects what the database actually holds.
      await loadCandidates();
      return saved;
    } catch (createError) {
      setError(createError.message);
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Candidates</h1>
        <p className="mt-1 text-sm text-slate-500">
          Paste resumes here first, then run a match from the Match tab.
        </p>
      </div>

      <Alert type="error" message={error} onDismiss={() => setError('')} />
      <Alert type="success" message={success} onDismiss={() => setSuccess('')} />

      <CandidateForm onCreate={handleCreate} isSaving={isSaving} />

      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          In the database ({candidates.length})
        </h2>
        <span className="text-xs text-slate-500">
          Scores are from the last job description each candidate was matched against
        </span>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading candidates...
        </div>
      ) : (
        <ResultsTable
          results={candidates}
          onSelectCandidate={setSelectedCandidate}
          emptyMessage="No candidates yet. Add one with the form above."
        />
      )}

      <CandidateDetailModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
}

export default CandidatesPage;
