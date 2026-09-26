import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { focusRing } from './formStyles';

/**
 * A single status message.
 *
 * Each type pairs its colour with both an icon and the message text, so the
 * meaning never depends on colour alone. Returns null when there is no
 * message, which lets callers render it unconditionally.
 */
function Alert({ type = 'info', message, onDismiss }) {
  if (!message) return null;

  const styles = {
    error: {
      surface: 'bg-critical-soft dark:bg-critical-dark/10 text-critical-ink dark:text-critical-dark border-critical-line dark:border-critical-dark/30',
      Icon: AlertCircle,
    },
    success: {
      surface: 'bg-good-soft dark:bg-good-dark/10 text-good-ink dark:text-good-dark border-good-line dark:border-good-dark/30',
      Icon: CheckCircle2,
    },
    info: {
      surface: 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 border-primary-200',
      Icon: Info,
    },
  };

  const { surface, Icon } = styles[type] ?? styles.info;

  return (
    <div className={`mt-4 flex items-start gap-3 rounded-ui border px-4 py-3 text-meta ${surface}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">{message}</span>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={`shrink-0 rounded-ui opacity-60 transition-opacity duration-150 hover:opacity-100 ${focusRing}`}
          aria-label="Dismiss message"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default Alert;
