/**
 * A single-line status message: errors in red, successes in green, notes in blue.
 * Returns null when there is no message, so callers can render it unconditionally.
 */
function Alert({ type = 'info', message, onDismiss }) {
  if (!message) return null;

  const styles = {
    error: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  return (
    <div className={`flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm ${styles[type]}`}>
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 font-bold opacity-60 hover:opacity-100"
          aria-label="Dismiss message"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default Alert;
