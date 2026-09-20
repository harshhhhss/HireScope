import { useState } from 'react';
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
    strong: 'bg-good-soft text-good-ink border-good-line',
    'needs work': 'bg-warning-soft text-warning-ink border-warning-line',
    'off target': 'bg-serious-soft text-serious-ink border-serious-line',
  };

  return (
    <li className="py-4">
      <div className="flex gap-3">
        <span className="text-meta font-semibold tabular-nums text-ink-400">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <p className="text-body text-ink-700">{question}</p>

          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            disabled={isEvaluating}
            rows={4}
            placeholder="Type how you would answer this out loud..."
            className="mt-3 w-full rounded-ui border border-ink-300 p-3 text-body text-ink-900 transition-colors placeholder:text-ink-400 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600 disabled:bg-ink-50"
          />

          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleGetFeedback}
              disabled={!canSubmit}
              className="rounded-ui border border-ink-300 px-3 py-1.5 text-meta font-medium text-ink-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEvaluating ? 'Reading your answer...' : 'Get feedback'}
            </button>

            {isEvaluating && (
              <span className="text-meta text-ink-400">A few seconds.</span>
            )}
          </div>

          {error && <p className="mt-2 text-meta text-critical-ink">{error}</p>}

          {feedback && (
            <div className="mt-3 rounded-ui border border-ink-200 bg-ink-50 p-4">
              <span
                className={`inline-block rounded-ui border px-2.5 py-1 text-label uppercase ${
                  verdictStyles[feedback.verdict] ?? verdictStyles['needs work']
                }`}
              >
                {feedback.verdict}
              </span>

              {feedback.summary && (
                <p className="mt-2 text-body text-ink-700">{feedback.summary}</p>
              )}

              {feedback.suggestions.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {feedback.suggestions.map((suggestion, suggestionIndex) => (
                    <li
                      key={suggestionIndex}
                      className="flex gap-2 text-meta text-ink-600"
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
