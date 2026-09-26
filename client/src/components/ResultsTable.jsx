import Avatar from './Avatar';
import Button from './Button';
import SkillTags from './SkillTags';
import FitScoreBadge from './FitScoreBadge';

/**
 * The ranked results table.
 *
 * The API already returns `results` sorted by fit_score (best first), so this
 * component renders the order it is given rather than sorting again.
 *
 * Two layouts of the same data:
 *
 *   md and up - a real table. Five columns of skill chips only work when
 *               there is room for them.
 *   below md  - one card per candidate. A horizontally scrolling table at
 *               375px technically "fits", but nobody scrolls sideways to read
 *               a row, so the columns become stacked labelled rows instead.
 *
 * Each row leads with an avatar. A dense column of names gives the eye nothing
 * to catch; a coloured disc per person turns scanning into recognising.
 */

function ResultRow({ candidate, onSelectCandidate }) {
  return (
    <tr className="align-middle transition-colors duration-150 hover:bg-primary-50/50 dark:hover:bg-ink-900/60">
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <Avatar name={candidate.name} />
          <div className="min-w-0">
            <div className="font-display text-subheading text-ink-900 dark:text-ink-100">
              {candidate.name}
            </div>
            <div className="truncate text-meta text-ink-500">{candidate.email}</div>
          </div>
        </div>
      </td>

      <td className="px-6 py-5">
        <FitScoreBadge score={candidate.fit_score} />
      </td>

      <td className="max-w-xs px-6 py-5">
        <SkillTags skills={candidate.matched_skills} variant="matched" emptyText="No overlap" />
      </td>

      <td className="max-w-xs px-6 py-5">
        <SkillTags
          skills={candidate.missing_skills}
          variant="missing"
          emptyText="Nothing missing"
        />
      </td>

      <td className="px-6 py-5 text-right">
        <Button
          variant="secondary"
          size="sm"
          className="whitespace-nowrap"
          onClick={() => onSelectCandidate(candidate)}
        >
          View ({candidate.interview_questions?.length ?? 0})
        </Button>
      </td>
    </tr>
  );
}

function ResultCard({ candidate, onSelectCandidate }) {
  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={candidate.name} />
          <div className="min-w-0">
            <p className="font-display text-subheading text-ink-900 dark:text-ink-100">
              {candidate.name}
            </p>
            <p className="truncate text-meta text-ink-500">{candidate.email}</p>
          </div>
        </div>
        <FitScoreBadge score={candidate.fit_score} />
      </div>

      <div className="mt-4">
        <p className="text-label uppercase text-ink-400">Matched skills</p>
        <div className="mt-1.5">
          <SkillTags skills={candidate.matched_skills} variant="matched" emptyText="No overlap" />
        </div>
      </div>

      <div className="mt-3">
        <p className="text-label uppercase text-ink-400">Areas to develop</p>
        <div className="mt-1.5">
          <SkillTags
            skills={candidate.missing_skills}
            variant="missing"
            emptyText="Nothing missing"
          />
        </div>
      </div>

      <Button
        variant="secondary"
        size="sm"
        className="mt-4 w-full"
        onClick={() => onSelectCandidate(candidate)}
      >
        View {candidate.interview_questions?.length ?? 0} questions
      </Button>
    </div>
  );
}

function ResultsTable({ results, onSelectCandidate, emptyMessage }) {
  if (!results || results.length === 0) {
    return (
      <div className="rounded-panel border border-dashed border-ink-300 bg-white p-12 text-center dark:border-ink-700 dark:bg-ink-950">
        <p className="text-body text-ink-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-panel border border-ink-200 bg-white shadow-card dark:border-ink-800 dark:bg-ink-950">
      {/* ---- Phone: stacked cards ---- */}
      <div className="divide-y divide-ink-200 dark:divide-ink-800 md:hidden">
        {results.map((candidate) => (
          <ResultCard
            key={candidate._id}
            candidate={candidate}
            onSelectCandidate={onSelectCandidate}
          />
        ))}
      </div>

      {/* ---- Tablet and up: the table ---- */}
      <div className="hidden md:block">
        <table className="w-full text-left">
          <thead className="border-b border-ink-200 bg-ink-50 dark:border-ink-800 dark:bg-ink-900/60">
            <tr className="text-label uppercase text-ink-400">
              <th className="px-6 py-3.5 font-semibold">Candidate</th>
              <th className="px-6 py-3.5 font-semibold">Fit score</th>
              <th className="px-6 py-3.5 font-semibold">Matched skills</th>
              <th className="px-6 py-3.5 font-semibold">Areas to develop</th>
              <th className="px-6 py-3.5 text-right font-semibold">Questions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-ink-200 dark:divide-ink-800">
            {results.map((candidate) => (
              <ResultRow
                key={candidate._id}
                candidate={candidate}
                onSelectCandidate={onSelectCandidate}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResultsTable;
