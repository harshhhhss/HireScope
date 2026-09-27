import { useState } from 'react';
import { ChevronDown, ChevronUp, Compass } from 'lucide-react';
import { getScoreBand } from './FitScoreBadge';
import { focusRing } from './formStyles';
import Button from './Button';

/**
 * "Which roles does my resume fit?"
 *
 * The same embedding comparison the single-JD match runs, against a library of
 * canonical role profiles instead of one pasted posting. It sits above the
 * paste-a-JD step because it answers the earlier question: someone who does not
 * yet know what to apply for has nothing to paste.
 *
 * Scores reuse getScoreBand, so a 72 here is coloured exactly as a 72 from a
 * real posting. That consistency matters more than it looks: two differently
 * coloured 72s would imply the numbers mean different things.
 *
 * The framing is deliberately flat - "role fit score", never a recommendation.
 * These are comparisons against text we wrote, not against live openings, and
 * the note at the bottom says so rather than leaving it implied.
 */

const TOP_COUNT = 4;

function RoleCard({ role, rank }) {
  const band = getScoreBand(role.fit_score);

  return (
    <div className="rounded-panel border border-ink-200 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lifted dark:border-ink-800 dark:bg-ink-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-label uppercase text-ink-400">
            #{rank} &middot; {role.branch}
          </span>
          <h4 className="mt-1 font-display text-subheading text-ink-900 dark:text-ink-100">
            {role.title}
          </h4>
        </div>

        <div className="shrink-0 text-right">
          <span className={`font-display text-heading tabular-nums ${band.text}`}>
            {role.fit_score.toFixed(1)}
          </span>
          <p className="text-label uppercase text-ink-400">fit</p>
        </div>
      </div>

      {/* A bar rather than a second ring: four rings would compete with the
          quality score above, which is the headline on this page. */}
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <div
          className={`h-full rounded-full ${band.bar} transition-[width] duration-700 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, role.fit_score))}%` }}
        />
      </div>
    </div>
  );
}

function RoleFitSection({ roles, profileCount, isLoading, error, onRetry }) {
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <section className="rounded-panel border border-ink-200 bg-white p-7 shadow-card dark:border-ink-800 dark:bg-ink-950">
        <h3 className="font-display text-heading text-ink-900 dark:text-ink-100">
          Which roles does my resume fit?
        </h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="animate-pulse rounded-panel border border-ink-200 p-5 dark:border-ink-800"
            >
              <div className="h-2.5 w-24 rounded-ui bg-ink-100 dark:bg-ink-800" />
              <div className="mt-2 h-4 w-44 rounded-ui bg-ink-200 dark:bg-ink-800" />
              <div className="mt-4 h-1.5 w-full rounded-full bg-ink-100 dark:bg-ink-800" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-panel border border-ink-200 bg-white p-7 shadow-card dark:border-ink-800 dark:bg-ink-950">
        <h3 className="font-display text-heading text-ink-900 dark:text-ink-100">
          Which roles does my resume fit?
        </h3>
        <p className="mt-2 text-meta text-critical-ink dark:text-critical-dark">{error}</p>
        {onRetry && (
          <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
            Try again
          </Button>
        )}
      </section>
    );
  }

  if (!roles || roles.length === 0) return null;

  const top = roles.slice(0, TOP_COUNT);

  // The full list is grouped by branch, because that is how a student reads it:
  // "what else in my own discipline", then "what outside it".
  const byBranch = roles.reduce((groups, role) => {
    (groups[role.branch] = groups[role.branch] || []).push(role);
    return groups;
  }, {});

  return (
    <section className="rounded-panel border border-ink-200 bg-white p-7 shadow-card dark:border-ink-800 dark:bg-ink-950">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-ui bg-primary-600 text-white">
          <Compass className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-display text-heading text-ink-900 dark:text-ink-100">
            Which roles does my resume fit?
          </h3>
          <p className="mt-1 text-meta text-ink-500 dark:text-ink-400">
            Your resume compared against {profileCount} representative role descriptions,
            using the same similarity measure as the job match below.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {top.map((role, index) => (
          <RoleCard key={role.id} role={role} rank={index + 1} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowAll((open) => !open)}
        aria-expanded={showAll}
        className={`mt-5 flex items-center gap-2 rounded-ui text-meta font-medium text-ink-600 transition-colors duration-150 hover:text-primary-700 dark:text-ink-400 dark:hover:text-primary-300 ${focusRing}`}
      >
        {showAll ? 'Hide the full list' : `See all ${roles.length} roles by branch`}
        {showAll ? (
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      {showAll && (
        <div className="mt-5 space-y-6 border-t border-ink-200 pt-5 dark:border-ink-800">
          {Object.entries(byBranch).map(([branch, branchRoles]) => (
            <div key={branch}>
              <h4 className="text-label uppercase text-ink-400">{branch}</h4>
              <ul className="mt-2 divide-y divide-ink-200 dark:divide-ink-800">
                {branchRoles.map((role) => {
                  const band = getScoreBand(role.fit_score);
                  return (
                    <li key={role.id} className="flex items-center justify-between gap-4 py-2.5">
                      <span className="text-body text-ink-700 dark:text-ink-300">
                        {role.title}
                      </span>
                      <span className={`shrink-0 text-body font-semibold tabular-nums ${band.text}`}>
                        {role.fit_score.toFixed(1)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* The same honesty as the single-JD note, applied to this wider set. */}
      <p className="mt-6 border-t border-ink-200 pt-4 text-meta text-ink-500 dark:border-ink-800 dark:text-ink-400">
        These are pre-written descriptions of what each role typically involves, not
        live job openings. A score is how closely your resume reads like that
        description, so it reflects the words on the page, not whether you would be
        hired or whether anyone is currently recruiting for it.
      </p>
    </section>
  );
}

export default RoleFitSection;
