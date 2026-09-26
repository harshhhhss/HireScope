import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SkillTags from './SkillTags';
import { focusRing } from './formStyles';

/**
 * Shows the working behind the fit score.
 *
 * The score on its own is a number the user has no way to check. This opens up
 * the three things that produced it:
 *
 *   1. the raw cosine similarity, next to the 0-100 figure, so it is obvious
 *      the score is that value rescaled rather than a separate judgement
 *   2. the resume lines that matched the posting most closely, which is the
 *      part a user can actually verify against their own eyes
 *   3. the skills diff, which comes from keyword matching and NOT from the
 *      similarity calculation - two different mechanisms behind one card
 *
 * Collapsed by default: the number is the answer, this is the evidence, and
 * evidence belongs one step behind the answer rather than in front of it.
 */
function ScoreBreakdown({ fitScore, similarity, topMatches, matchedSkills, missingSkills }) {
  const [isOpen, setIsOpen] = useState(false);

  const pairs = topMatches ?? [];

  return (
    <div className="rounded-ui border border-ink-200 dark:border-ink-800">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex w-full items-center justify-between gap-3 rounded-ui px-4 py-3 text-left transition-colors duration-150 hover:bg-ink-50 ${focusRing}`}
        aria-expanded={isOpen}
      >
        <span className="text-body font-medium text-ink-900 dark:text-ink-100">
          How this score was calculated
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-ink-400" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 text-ink-400" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-6 border-t border-ink-200 dark:border-ink-800 p-4">
          {/* ---- 1. The arithmetic ---- */}
          <div>
            <h4 className="text-label uppercase text-ink-400">The number</h4>
            <p className="mt-2 text-body text-ink-700 dark:text-ink-300">
              Semantic similarity:{' '}
              <span className="font-semibold tabular-nums text-ink-900 dark:text-ink-100">
                {typeof similarity === 'number' ? similarity.toFixed(4) : 'not reported'}
              </span>
            </p>
            {typeof similarity === 'number' && (
              <p className="mt-1 text-meta text-ink-500 dark:text-ink-400">
                The fit score is this value multiplied by 100
                {' '}({similarity.toFixed(4)} &times; 100 = {fitScore?.toFixed?.(2) ?? fitScore}).
                Cosine similarity runs from 0 to 1.
              </p>
            )}
          </div>

          {/* ---- 2. The evidence ---- */}
          <div>
            <h4 className="text-label uppercase text-ink-400">What drove this score</h4>

            {pairs.length > 0 ? (
              <ul className="mt-2 space-y-3">
                {pairs.map((pair, index) => (
                  <li key={index} className="rounded-ui border border-ink-200 dark:border-ink-800 bg-ink-50 dark:bg-ink-900/60 p-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-label uppercase text-ink-400">
                        Pair {index + 1}
                      </span>
                      <span className="text-meta font-semibold tabular-nums text-ink-600 dark:text-ink-400">
                        {pair.similarity.toFixed(3)}
                      </span>
                    </div>

                    <p className="mt-2 text-meta text-ink-500 dark:text-ink-400">Your resume</p>
                    <p className="text-body text-ink-800 dark:text-ink-200">&ldquo;{pair.resume}&rdquo;</p>

                    <p className="mt-2 text-meta text-ink-500 dark:text-ink-400">The posting</p>
                    <p className="text-body text-ink-800 dark:text-ink-200">&ldquo;{pair.job}&rdquo;</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-meta text-ink-500 dark:text-ink-400">
                No individual sentence pairs scored highly enough to single out. The
                overall score still reflects the documents as a whole.
              </p>
            )}
          </div>

          {/* ---- 3. The other, separate mechanism ---- */}
          <div>
            <h4 className="text-label uppercase text-ink-400">Skills found</h4>
            <p className="mt-1 text-meta text-ink-500 dark:text-ink-400">
              Matched by keyword against a fixed list of around 60 skills. This is a
              separate check and does not feed into the similarity score above.
            </p>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-meta font-medium text-ink-700 dark:text-ink-300">In both</p>
                <div className="mt-1.5">
                  <SkillTags
                    skills={matchedSkills}
                    variant="matched"
                    emptyText="No overlap"
                  />
                </div>
              </div>

              <div>
                <p className="text-meta font-medium text-ink-700 dark:text-ink-300">Asked for, not found</p>
                <div className="mt-1.5">
                  <SkillTags
                    skills={missingSkills}
                    variant="missing"
                    emptyText="Nothing missing"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScoreBreakdown;
