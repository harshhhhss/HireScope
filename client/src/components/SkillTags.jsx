/**
 * A list of skills rendered as chips.
 *
 * The two variants say different things, and the styling is what makes that
 * clear:
 *
 *   matched - the `good` status treatment. This is a genuine positive: the
 *             candidate has what the posting asked for.
 *
 *   missing - a neutral outline, NOT a status colour. A red chip would read as
 *             an error the candidate is responsible for, which is wrong: not
 *             having a skill yet is information, not a failure. These are
 *             framed as areas to develop, so they stay quiet and factual.
 */
function SkillTags({ skills, variant = 'matched', emptyText = 'None' }) {
  if (!skills || skills.length === 0) {
    return <span className="text-meta text-ink-400">{emptyText}</span>;
  }

  const styles = {
    matched: 'bg-good-soft text-good-ink border-good-line',
    missing: 'bg-transparent text-ink-600 border-ink-300',
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <span
          key={skill}
          className={`inline-block rounded-ui border px-2.5 py-1 text-meta font-medium ${styles[variant]}`}
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

export default SkillTags;
