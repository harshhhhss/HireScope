import { useState } from 'react';

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
    <form onSubmit={handleSubmit} className="rounded-ui border border-ink-200 bg-white p-6">
      <label htmlFor="job-description" className="block text-heading text-ink-900">
        Job description
      </label>
      <p className="mt-1 text-body text-ink-500">
        Paste the full posting. Every candidate in the database will be scored against it.
      </p>

      <textarea
        id="job-description"
        value={jobDescription}
        onChange={(event) => setJobDescription(event.target.value)}
        disabled={isMatching}
        rows={10}
        placeholder="Senior Backend Engineer. Strong Python and Node.js, MongoDB, Docker, Kubernetes and AWS..."
        className="mt-4 w-full rounded-ui border border-ink-300 p-3 text-body text-ink-900 transition-colors placeholder:text-ink-400 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600 disabled:bg-ink-50"
      />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-meta text-ink-500">
          {candidateCount === 0
            ? 'Add a candidate before matching.'
            : `${candidateCount} candidate${candidateCount === 1 ? '' : 's'} will be scored.`}
        </span>

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-ui bg-primary-600 px-5 py-2.5 text-meta font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-ink-300"
        >
          {isMatching ? 'Matching...' : 'Match candidates'}
        </button>
      </div>

      {isMatching && (
        <p className="mt-2 text-meta text-ink-500">
          Scoring each resume and generating interview questions. This can take a few
          seconds per candidate.
        </p>
      )}
    </form>
  );
}

export default JobDescriptionForm;
