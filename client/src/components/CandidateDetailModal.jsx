import { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';
import SkillTags from './SkillTags';
import FitScoreBadge from './FitScoreBadge';

/**
 * Modal showing one candidate's full result, including the three interview
 * questions Gemini generated from their resume and missing skills.
 *
 * The modal itself is the card. Everything inside it is separated with
 * headings, spacing and dividers rather than nested boxes - three questions
 * in three bordered panels inside a panel was structure for its own sake.
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/50 p-4 sm:items-center"
      onClick={onClose}
    >
      {/* ...and stopPropagation stops a click inside the panel bubbling up to it. */}
      <div
        className="w-full max-w-2xl rounded-ui bg-white dark:bg-ink-950 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-200 dark:border-ink-800 p-6">
          <div>
            <h2 className="text-heading font-display text-ink-900 dark:text-ink-100">{candidate.name}</h2>
            <p className="text-meta text-ink-500 dark:text-ink-400">{candidate.email}</p>
          </div>

          <div className="flex items-start gap-4">
            <FitScoreBadge score={candidate.fit_score} />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close"
              className="px-2 text-ink-400"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <h3 className="text-label uppercase text-ink-400">Matched skills</h3>
            <div className="mt-2">
              <SkillTags
                skills={candidate.matched_skills}
                variant="matched"
                emptyText="No overlap with this job description"
              />
            </div>
          </div>

          <div>
            <h3 className="text-label uppercase text-ink-400">Areas to develop</h3>
            <div className="mt-2">
              <SkillTags
                skills={candidate.missing_skills}
                variant="missing"
                emptyText="Nothing missing"
              />
            </div>
          </div>

          <div>
            <h3 className="text-label uppercase text-ink-400">Interview questions</h3>

            {questions.length > 0 ? (
              // A divided list, not a stack of cards. The rule between rows is
              // enough to separate them.
              <ol className="mt-1 divide-y divide-ink-200 dark:divide-ink-800">
                {questions.map((question, index) => (
                  <li key={index} className="flex gap-4 py-3 text-body text-ink-700 dark:text-ink-300">
                    <span className="text-meta font-semibold tabular-nums text-ink-400">
                      {index + 1}
                    </span>
                    <span>{question}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-meta text-ink-500 dark:text-ink-400">
                {candidate.warning
                  ? candidate.warning
                  : 'No questions yet - run a match for this candidate.'}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-ink-200 dark:border-ink-800 p-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

export default CandidateDetailModal;
