import { Info } from 'lucide-react';

/**
 * A permanent, plain-language note on what the score is and is not.
 *
 * Always visible, never behind a click. The collapsible breakdown next to it
 * answers "where did this number come from"; this answers the prior question,
 * "what kind of thing is this number at all" - which someone needs before they
 * decide how much to trust it, not after.
 *
 * The limitation line is the point of the whole component. A 0-100 figure next
 * to a job posting invites being read as a prediction about getting hired, and
 * it is not one.
 */
function MethodologyNote() {
  return (
    <div className="flex gap-3 rounded-ui border border-ink-200 dark:border-ink-800 bg-ink-50 dark:bg-ink-900/60 p-4">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />

      <div className="text-meta text-ink-600 dark:text-ink-400">
        <p className="font-medium text-ink-700 dark:text-ink-300">How this works</p>
        <p className="mt-1">
          Your resume and the job description are each turned into a list of numbers
          that represents their meaning, and the score is how close those two lists
          sit to each other. The skills list is separate: it comes from matching
          against a fixed list of skill names, not from the same calculation.
        </p>
        <p className="mt-2">
          This measures how closely your resume reads like the posting. It is not a
          prediction of whether you will be interviewed or hired, and it cannot see
          anything the text does not say.
        </p>
        <p className="mt-2">
          The role fit scores above compare your resume against descriptions we
          wrote of what each role typically involves, not against real openings. A
          high score means your resume reads like that kind of work, not that such a
          job is open or that you would be shortlisted for it.
        </p>
        <p className="mt-2">
          Those scores are adjusted before you see them, for a reason worth knowing.
          Broadly written role descriptions sit close to almost any resume, so on the
          raw measure they beat specific ones by default. Each role is therefore first
          scored against a fixed set of sample resumes from every branch, and what you
          see is how far above that baseline your resume got. A role you match no
          better than an arbitrary resume does shows zero, which is why some roles read
          0.0 rather than a small number.
        </p>
      </div>
    </div>
  );
}

export default MethodologyNote;
