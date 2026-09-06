import SkillTags from './SkillTags';
import FitScoreBadge from './FitScoreBadge';

/**
 * The ranked results table.
 *
 * The API already returns `results` sorted by fit_score (best first), so this
 * component renders the order it is given rather than sorting again.
 */
function ResultsTable({ results, onSelectCandidate, emptyMessage }) {
  if (!results || results.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      {/* overflow-x-auto keeps the table usable on a narrow screen instead of
          squashing the skill columns. */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Candidate</th>
              <th className="px-4 py-3 font-medium">Fit score</th>
              <th className="px-4 py-3 font-medium">Matched skills</th>
              <th className="px-4 py-3 font-medium">Missing skills</th>
              <th className="px-4 py-3 font-medium text-right">Questions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {results.map((candidate) => (
              <tr key={candidate._id} className="align-top hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{candidate.name}</div>
                  <div className="text-xs text-slate-500">{candidate.email}</div>
                </td>

                <td className="px-4 py-3">
                  <FitScoreBadge score={candidate.fit_score} />
                </td>

                <td className="max-w-xs px-4 py-3">
                  <SkillTags
                    skills={candidate.matched_skills}
                    variant="matched"
                    emptyText="No overlap"
                  />
                </td>

                <td className="max-w-xs px-4 py-3">
                  <SkillTags
                    skills={candidate.missing_skills}
                    variant="missing"
                    emptyText="Nothing missing"
                  />
                </td>

                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onSelectCandidate(candidate)}
                    className="whitespace-nowrap rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
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
