import { useRef, useState } from 'react';
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
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? 'Reading your file...' : 'Upload PDF or DOCX'}
        </button>

        <span className="text-sm text-slate-400">or paste it below</span>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </div>

      {uploadedName && !uploadError && (
        <p className="mt-2 text-sm text-green-700">
          Loaded {uploadedName} - check the text below looks right.
        </p>
      )}

      {uploadError && <p className="mt-2 text-sm text-red-700">{uploadError}</p>}

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={busy}
        rows={12}
        placeholder="Paste your resume here, or upload a file above..."
        className="mt-3 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50"
      />

      <p className="mt-1 text-xs text-slate-400">
        {value.trim().length > 0
          ? `${value.trim().length.toLocaleString()} characters`
          : 'Nothing entered yet'}
      </p>
    </div>
  );
}

export default ResumeInput;
