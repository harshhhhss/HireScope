import SkillTags from './SkillTags';
import FitScoreBadge from './FitScoreBadge';

/**
 * The ranked results table.
 *
 * The API already returns `results` sorted by fit_score (best first), so this
 * component renders the order it is given rather than sorting again.
 *
 * The table is one card. Rows are separated by rules and the score column
 * carries the visual weight - no per-row or per-cell boxes.
 */
function ResultsTable({ results, onSelectCandidate, emptyMessage }) {
  if (!results || results.length === 0) {
    return (
      <div className="rounded-ui border border-dashed border-ink-300 bg-white p-10 text-center">
        <p className="text-body text-ink-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-ui border border-ink-200 bg-white">
      {/* overflow-x-auto keeps the table usable on a narrow screen instead of
          squashing the skill columns. */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-ink-200 bg-ink-50">
            <tr className="text-label uppercase text-ink-400">
              <th className="px-5 py-3 font-semibold">Candidate</th>
              <th className="px-5 py-3 font-semibold">Fit score</th>
              <th className="px-5 py-3 font-semibold">Matched skills</th>
              <th className="px-5 py-3 font-semibold">Areas to develop</th>
              <th className="px-5 py-3 text-right font-semibold">Questions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-ink-200">
            {results.map((candidate) => (
              <tr key={candidate._id} className="align-top transition-colors hover:bg-ink-50">
                <td className="px-5 py-4">
                  <div className="text-body font-semibold text-ink-900">{candidate.name}</div>
                  <div className="text-meta text-ink-500">{candidate.email}</div>
                </td>

                <td className="px-5 py-4">
                  <FitScoreBadge score={candidate.fit_score} />
                </td>

                <td className="max-w-xs px-5 py-4">
                  <SkillTags
                    skills={candidate.matched_skills}
                    variant="matched"
                    emptyText="No overlap"
                  />
                </td>

                <td className="max-w-xs px-5 py-4">
                  <SkillTags
                    skills={candidate.missing_skills}
                    variant="missing"
                    emptyText="Nothing missing"
                  />
                </td>

                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onSelectCandidate(candidate)}
                    className="whitespace-nowrap rounded-ui border border-ink-300 px-3 py-1.5 text-meta font-medium text-ink-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                  >
                    View ({candidate.interview_questions?.length ?? 0})
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResultsTable;
