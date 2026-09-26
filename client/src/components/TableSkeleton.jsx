/**
 * The placeholder shown while the candidate list is loading.
 *
 * It mirrors the shape of the table it is replacing - same columns, same row
 * height - so the page does not jump when the real rows arrive. That is the
 * point of a skeleton over a spinner: a spinner says "something is happening",
 * a skeleton says "this is what is coming".
 *
 * The pulse is the one animation here that earns its place: it marks the
 * difference between "loading" and "empty", which would otherwise look the same.
 */
function TableSkeleton({ rows = 3 }) {
  return (
    <div className="overflow-hidden rounded-ui border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-950">
      <div className="border-b border-ink-200 dark:border-ink-800 bg-ink-50 dark:bg-ink-900/60 px-5 py-3">
        <span className="text-label uppercase text-ink-400">Loading candidates</span>
      </div>

      <div className="divide-y divide-ink-200 dark:divide-ink-800">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex animate-pulse items-center gap-6 px-5 py-4">
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-40 rounded-ui bg-ink-200 dark:bg-ink-800" />
              <div className="h-2.5 w-56 rounded-ui bg-ink-100 dark:bg-ink-800" />
            </div>
            <div className="h-8 w-14 rounded-ui bg-ink-200 dark:bg-ink-800" />
            <div className="hidden flex-1 gap-1.5 sm:flex">
              <div className="h-6 w-16 rounded-ui bg-ink-100 dark:bg-ink-800" />
              <div className="h-6 w-20 rounded-ui bg-ink-100 dark:bg-ink-800" />
            </div>
            <div className="h-8 w-20 rounded-ui bg-ink-100 dark:bg-ink-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default TableSkeleton;
