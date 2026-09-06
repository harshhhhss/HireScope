/**
 * The 0-100 fit score, coloured by band so a recruiter can scan the column:
 * green = strong match, amber = worth a look, red = weak.
 */
function FitScoreBadge({ score }) {
  const value = typeof score === 'number' ? score : 0;

  let style = 'bg-red-100 text-red-800';
  if (value >= 70) style = 'bg-green-100 text-green-800';
  else if (value >= 40) style = 'bg-amber-100 text-amber-800';

  return (
    <span className={`inline-block rounded-md px-2.5 py-1 text-sm font-semibold tabular-nums ${style}`}>
      {value.toFixed(1)}
    </span>
  );
}

export default FitScoreBadge;
