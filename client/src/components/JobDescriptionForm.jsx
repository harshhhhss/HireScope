import { useState } from 'react';
import Button from './Button';
import { textareaClass } from './formStyles';

/**
 * The textarea a recruiter pastes a job description into.
 *
 * This component owns only the draft text; the parent page owns the request,
 * so it also receives `isMatching` to disable the form while one is in flight.
 */
function JobDescriptionForm({ onSubmit, isMatching, candidateCount }) {
  const [jobDescription, setJobDescription] = useState('');

  const trimmed = jobDescription.trim();
  // Nothing to match if the box is empty, a request is running, or the
  // database has no candidates to score.
  const canSubmit = trimmed.length > 0 && !isMatching && candidateCount > 0;

  function handleSubmit(event) {
    // Stop the browser reloading the page, which is the default for form submits.
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-panel border border-ink-200 bg-white dark:bg-ink-950 dark:border-ink-800 p-7 shadow-card">
      <label htmlFor="job-description" className="block text-heading font-display text-ink-900 dark:text-ink-100">
        Job description
      </label>
      <p className="mt-1 text-body text-ink-500 dark:text-ink-400">
        Paste the full posting. Every candidate in the database will be scored against it.
      </p>

      <textarea
        id="job-description"
        value={jobDescription}
        onChange={(event) => setJobDescription(event.target.value)}
        disabled={isMatching}
        rows={10}
        placeholder="Senior Backend Engineer. Strong Python and Node.js, MongoDB, Docker, Kubernetes and AWS..."
        className={`mt-4 ${textareaClass}`}
      />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-meta text-ink-500 dark:text-ink-400">
          {candidateCount === 0
            ? 'Add a candidate before matching.'
            : `${candidateCount} candidate${candidateCount === 1 ? '' : 's'} will be scored.`}
        </span>

        <Button type="submit" size="lg" disabled={!canSubmit}>
          {isMatching ? 'Matching...' : 'Match candidates'}
        </Button>
      </div>

      {isMatching && (
        <p className="mt-2 text-meta text-ink-500 dark:text-ink-400">
          Scoring each resume and generating interview questions. This can take a few
          seconds per candidate.
        </p>
      )}
    </form>
  );
}

export default JobDescriptionForm;
