import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

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
      surface: 'bg-critical-soft text-critical-ink border-critical-line',
      Icon: AlertCircle,
    },
    success: {
      surface: 'bg-good-soft text-good-ink border-good-line',
      Icon: CheckCircle2,
    },
    info: {
      surface: 'bg-primary-50 text-primary-700 border-primary-200',
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
          className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
          aria-label="Dismiss message"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default Alert;
