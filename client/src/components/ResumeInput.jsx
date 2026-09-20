import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { uploadResumeFile } from '../services/api';

/**
 * Get a resume into the app, either by uploading a file or pasting text.
 *
 * Upload is a shortcut, not a replacement: the file is sent to the server,
 * turned into plain text, and dropped into the same textarea the user could
 * have typed into. That means they can always see and edit exactly what will
 * be analysed, and pasting still works with no file at all.
 *
 * The parent owns the text; this component owns only the upload in progress.
 */
function ResumeInput({ value, onChange, disabled }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedName, setUploadedName] = useState('');
  const fileInputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;

    setIsUploading(true);
    setUploadError('');
    setUploadedName('');

    try {
      const { resume_text, filename, format } = await uploadResumeFile(file);
      onChange(resume_text);
      setUploadedName(`${filename} (${format.toUpperCase()})`);
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
      // Reset the input so picking the same file again still fires onChange.
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const busy = disabled || isUploading;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-ui border border-ink-300 bg-white px-4 py-2 text-meta font-medium text-ink-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {isUploading ? 'Reading your file...' : 'Upload PDF or DOCX'}
        </button>

        <span className="text-meta text-ink-400">or paste it below</span>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </div>

      {uploadedName && !uploadError && (
        <p className="mt-2 text-meta text-good-ink">
          Loaded {uploadedName} - check the text below looks right.
        </p>
      )}

      {uploadError && <p className="mt-2 text-meta text-critical-ink">{uploadError}</p>}

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={busy}
        rows={12}
        placeholder="Paste your resume here, or upload a file above..."
        className="mt-3 w-full rounded-ui border border-ink-300 p-3 text-body text-ink-900 transition-colors placeholder:text-ink-400 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600 disabled:bg-ink-50"
      />

      <p className="mt-1.5 text-meta text-ink-400">
        {value.trim().length > 0
          ? `${value.trim().length.toLocaleString()} characters`
          : 'Nothing entered yet'}
      </p>
    </div>
  );
}

export default ResumeInput;
