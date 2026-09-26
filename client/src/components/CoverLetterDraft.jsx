import { useState } from 'react';
import { Check, Copy, FileText } from 'lucide-react';
import Button from './Button';
import { readOnlyClass } from './formStyles';
import { getCoverLetter } from '../services/api';

/**
 * Draft a cover letter for the job currently being matched against.
 *
 * The letter lands in a read-only textarea. Read-only because this is a draft
 * to take away and edit properly, not a document this app owns - and making it
 * editable here would imply the edits are saved somewhere, which they are not.
 */
function CoverLetterDraft({ resumeText, jobDescription, matchedSkills }) {
  const [letter, setLetter] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleDraft() {
    if (isDrafting) return;

    setIsDrafting(true);
    setError('');
    setCopied(false);

    try {
      setLetter(await getCoverLetter({ resumeText, jobDescription, matchedSkills }));
    } catch (draftError) {
      setError(draftError.message);
      setLetter('');
    } finally {
      setIsDrafting(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      // Reset the label so the button does not stay stuck on "Copied".
      setTimeout(() => setCopied(false), 2000);
    } catch (copyError) {
      // Clipboard access can be blocked. The text is selectable either way,
      // so there is nothing to recover from and nothing worth interrupting for.
    }
  }

  return (
    <div className="border-t border-ink-200 dark:border-ink-800 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-label uppercase text-ink-400">Cover letter</h3>
          <p className="mt-1 text-meta text-ink-500 dark:text-ink-400">
            Drafted only from what your resume actually says - no invented experience.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={handleDraft} disabled={isDrafting}>
          <FileText className="h-4 w-4" aria-hidden="true" />
          {isDrafting ? 'Drafting...' : letter ? 'Draft again' : 'Draft a cover letter'}
        </Button>
      </div>

      {error && <p className="mt-3 text-meta text-critical-ink dark:text-critical-dark">{error}</p>}

      {letter && (
        <div className="mt-3">
          <textarea
            value={letter}
            readOnly
            rows={14}
            className={readOnlyClass}
          />

          <Button variant="secondary" size="sm" onClick={handleCopy} className="mt-2">
            {copied ? (
              <Check className="h-4 w-4 text-good" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default CoverLetterDraft;
