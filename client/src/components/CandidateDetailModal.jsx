import { useEffect } from 'react';
import SkillTags from './SkillTags';
import FitScoreBadge from './FitScoreBadge';

/**
 * Modal showing one candidate's full result, including the three interview
 * questions Gemini generated from their resume and missing skills.
 */
function CandidateDetailModal({ candidate, onClose }) {
  // Close on Escape. The cleanup function removes the listener when the modal
  // unmounts, otherwise every open would stack another listener on the window.
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!candidate) return null;

  const questions = candidate.interview_questions ?? [];

  return (
    // The backdrop closes the modal when clicked...
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:items-center"
      onClick={onClose}
    >
      {/* ...and stopPropagation stops a click inside the panel bubbling up to it. */}
      <div
        className="w-full max-w-2xl rounded-lg bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{candidate.name}</h2>
            <p className="text-sm text-slate-500">{candidate.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <FitScoreBadge score={candidate.fit_score} />
            <button
              type="button"
              onClick={onClose}
              className="text-2xl leading-none text-slate-400 hover:text-slate-700"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Matched skills
            </h3>
            <div className="mt-2">
              <SkillTags
                skills={candidate.matched_skills}
                variant="matched"
                emptyText="No overlap with this job description"
              />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Missing skills
            </h3>
            <div className="mt-2">
              <SkillTags
                skills={candidate.missing_skills}
                variant="missing"
                emptyText="Nothing missing"
              />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Interview questions
            </h3>

            {questions.length > 0 ? (
              <ol className="mt-2 space-y-3">
                {questions.map((question, index) => (
                  <li
                    key={index}
                    className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                  >
                    <span className="font-semibold text-slate-400">{index + 1}.</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                {candidate.warning
                  ? candidate.warning
                  : 'No questions yet - run a match for this candidate.'}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default CandidateDetailModal;
