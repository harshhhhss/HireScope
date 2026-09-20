import { useState } from 'react';
import { Check, Copy, FileText } from 'lucide-react';
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
    <div className="border-t border-ink-200 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-label uppercase text-ink-400">Cover letter</h3>
          <p className="mt-1 text-meta text-ink-500">
            Drafted only from what your resume actually says - no invented experience.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDraft}
          disabled={isDrafting}
          className="inline-flex items-center gap-2 rounded-ui border border-ink-300 px-3 py-1.5 text-meta font-medium text-ink-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          {isDrafting ? 'Drafting...' : letter ? 'Draft again' : 'Draft a cover letter'}
        </button>
      </div>

      {error && <p className="mt-3 text-meta text-critical-ink">{error}</p>}

      {letter && (
        <div className="mt-3">
          <textarea
            value={letter}
            readOnly
            rows={14}
            className="w-full rounded-ui border border-ink-300 bg-ink-50 p-3 text-body text-ink-900 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
          />

          <button
            type="button"
            onClick={handleCopy}
            className="mt-2 inline-flex items-center gap-2 rounded-ui border border-ink-300 px-3 py-1.5 text-meta font-medium text-ink-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
          >
            {copied ? (
              <Check className="h-4 w-4 text-good" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}

export default CoverLetterDraft;
