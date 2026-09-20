/**
 * A designed empty state: an icon, a line saying what belongs here, and a line
 * saying how to fill it.
 *
 * Blank space or a bare sentence is the single fastest way to make an app feel
 * unfinished - the reader cannot tell whether nothing is there yet or whether
 * something broke. Naming the next action removes that doubt.
 */
function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="rounded-ui border border-dashed border-ink-300 bg-white px-6 py-12 text-center">
      {Icon && (
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-ui bg-ink-100">
          <Icon className="h-5 w-5 text-ink-400" aria-hidden="true" />
        </div>
      )}

      <p className="text-heading text-ink-900">{title}</p>

      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-body text-ink-500">{description}</p>
      )}

      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export default EmptyState;
