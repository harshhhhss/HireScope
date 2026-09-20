import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { describeChange } from '../services/resumeHistory';
import { getScoreBand } from './FitScoreBadge';

/**
 * A small trend view of previous resume scores.
 *
 * Renders nothing at all when there is no history. Having checked your resume
 * once is the normal starting state, not something to apologise for with an
 * empty box - the first check simply says so on the score itself.
 */
function ProgressTrend({ history, onClear }) {
  if (!history || history.length === 0) return null;

  const change = describeChange(history);

  const trend = {
    up: { Icon: TrendingUp, className: 'text-good-ink' },
    down: { Icon: TrendingDown, className: 'text-warning-ink' },
    same: { Icon: Minus, className: 'text-ink-500' },
    first: { Icon: Minus, className: 'text-ink-500' },
  }[change.direction];

  const { Icon } = trend;

  // Newest first reads better in a list; the stored order is oldest first.
  const recent = [...history].reverse();

  const formatDate = (timestamp) =>
    new Date(timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  return (
    <div className="border-t border-ink-200 pt-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-label uppercase text-ink-400">Your progress</h3>
        {onClear && history.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-meta text-ink-400 transition-colors hover:text-ink-700"
          >
            Clear history
          </button>
        )}
      </div>

      <p className={`mt-2 flex items-center gap-2 text-body font-medium ${trend.className}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
        {change.label}
      </p>

      <ol className="mt-3 divide-y divide-ink-200">
        {recent.map((entry, index) => {
          const band = getScoreBand(entry.overall_score);
          return (
            <li
              key={entry.timestamp}
              className="flex items-baseline justify-between gap-4 py-2"
            >
              <span className="text-meta text-ink-500">
                {formatDate(entry.timestamp)}
                {index === 0 && <span className="ml-2 text-ink-400">latest</span>}
              </span>
              <span className={`text-body font-semibold tabular-nums ${band.text}`}>
                {entry.overall_score.toFixed(1)}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-meta text-ink-400">
        Saved in this browser only - not uploaded anywhere.
      </p>
    </div>
  );
}

export default ProgressTrend;
