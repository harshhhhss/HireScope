/**
 * Render a list of skill strings as coloured pills.
 *
 * `variant` picks the colour: green for skills the candidate has, amber for
 * the ones the job wants but the resume never mentions.
 */
function SkillTags({ skills, variant = 'matched', emptyText = 'None' }) {
  if (!skills || skills.length === 0) {
    return <span className="text-sm text-slate-400">{emptyText}</span>;
  }

  const styles = {
    matched: 'bg-green-100 text-green-800 border-green-200',
    missing: 'bg-amber-100 text-amber-800 border-amber-200',
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <span
          key={skill}
          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

export default SkillTags;
