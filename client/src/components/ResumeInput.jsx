import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import Button from './Button';
import { textareaClass } from './formStyles';
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
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {isUploading ? 'Reading your file...' : 'Upload PDF or DOCX'}
        </Button>

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
        <p className="mt-2 text-meta text-good-ink dark:text-good-dark">
          Loaded {uploadedName} - check the text below looks right.
        </p>
      )}

      {uploadError && <p className="mt-2 text-meta text-critical-ink dark:text-critical-dark">{uploadError}</p>}

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={busy}
        rows={12}
        placeholder="Paste your resume here, or upload a file above..."
        className={`mt-3 ${textareaClass}`}
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
