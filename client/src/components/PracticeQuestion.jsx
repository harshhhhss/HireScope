import { useState } from 'react';
import Button from './Button';
import { textareaClass } from './formStyles';
import { getInterviewFeedback } from '../services/api';

/**
 * One interview question the student can actually practise against.
 *
 * Each question owns its own answer, loading flag and feedback. That is the
 * point: a student works through these in whatever order they like, and one
 * page-wide spinner would block the other questions while a single answer is
 * being graded.
 */
function PracticeQuestion({ index, question, resumeText, missingSkills }) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = answer.trim().length > 0 && !isEvaluating;

  async function handleGetFeedback() {
    if (!canSubmit) return;

    setIsEvaluating(true);
    setError('');

    try {
      setFeedback(
        await getInterviewFeedback({
          question,
          answer: answer.trim(),
          resumeText,
          missingSkills,
        })
      );
    } catch (feedbackError) {
      setError(feedbackError.message);
      setFeedback(null);
    } finally {
      setIsEvaluating(false);
    }
  }

  // The verdict is a judgement about the answer, so it gets a status colour -
  // always next to the word itself, never colour alone.
  const verdictStyles = {
    strong: 'bg-good-soft dark:bg-good-dark/10 text-good-ink dark:text-good-dark border-good-line dark:border-good-dark/30',
    'needs work': 'bg-warning-soft dark:bg-warning-dark/10 text-warning-ink dark:text-warning-dark border-warning-line dark:border-warning-dark/30',
    'off target': 'bg-serious-soft dark:bg-serious-dark/10 text-serious-ink dark:text-serious-dark border-serious-line dark:border-serious-dark/30',
  };

  return (
    <li className="py-4">
      <div className="flex gap-3">
        <span className="text-meta font-semibold tabular-nums text-ink-400">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <p className="text-body text-ink-700 dark:text-ink-300">{question}</p>

          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            disabled={isEvaluating}
            rows={4}
            placeholder="Type how you would answer this out loud..."
            className={`mt-3 ${textareaClass}`}
          />

          <div className="mt-2 flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={handleGetFeedback} disabled={!canSubmit}>
              {isEvaluating ? 'Reading your answer...' : 'Get feedback'}
            </Button>

            {isEvaluating && (
              <span className="text-meta text-ink-400">A few seconds.</span>
            )}
          </div>

          {error && <p className="mt-2 text-meta text-critical-ink dark:text-critical-dark">{error}</p>}

          {feedback && (
            <div className="mt-3 rounded-ui border border-ink-200 dark:border-ink-800 bg-ink-50 dark:bg-ink-900/60 p-4">
              <span
                className={`inline-block rounded-ui border px-2.5 py-1 text-label uppercase ${
                  verdictStyles[feedback.verdict] ?? verdictStyles['needs work']
                }`}
              >
                {feedback.verdict}
              </span>

              {feedback.summary && (
                <p className="mt-2 text-body text-ink-700 dark:text-ink-300">{feedback.summary}</p>
              )}

              {feedback.suggestions.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {feedback.suggestions.map((suggestion, suggestionIndex) => (
                    <li
                      key={suggestionIndex}
                      className="flex gap-2 text-meta text-ink-600 dark:text-ink-400"
                    >
                      <span aria-hidden="true" className="text-ink-400">
                        -
                      </span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export default PracticeQuestion;
