import { useState } from 'react';
import Button from './Button';
import { inputClass, textareaClass } from './formStyles';

/** Blank form state, reused on mount and after a successful save. */
const EMPTY_FORM = { name: '', email: '', resume_text: '' };

/**
 * Add one candidate: name, email and the raw resume text.
 *
 * The backend stores `resume_text` as a plain string and has no file-upload
 * route, so a textarea is the whole interface - paste the resume in.
 */
function CandidateForm({ onCreate, isSaving }) {
  const [form, setForm] = useState(EMPTY_FORM);

  // One handler for all three inputs, keyed off each input's `name` attribute.
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  const canSubmit =
    form.name.trim() && form.email.trim() && form.resume_text.trim() && !isSaving;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    const saved = await onCreate({
      name: form.name.trim(),
      email: form.email.trim(),
      resume_text: form.resume_text.trim(),
    });

    // Only clear the form if the save actually succeeded, so a failed submit
    // does not throw away what the user typed.
    if (saved) setForm(EMPTY_FORM);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-panel border border-ink-200 bg-white dark:bg-ink-950 dark:border-ink-800 p-7 shadow-card">
      <h2 className="text-heading font-display text-ink-900 dark:text-ink-100">Add a candidate</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-meta font-medium text-ink-700 dark:text-ink-300">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            disabled={isSaving}
            placeholder="Harsh Singh"
            className={`mt-1.5 ${inputClass}`}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-meta font-medium text-ink-700 dark:text-ink-300">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            disabled={isSaving}
            placeholder="harsh@example.com"
            className={`mt-1.5 ${inputClass}`}
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="resume_text" className="block text-meta font-medium text-ink-700 dark:text-ink-300">
          Resume text
        </label>
        <textarea
          id="resume_text"
          name="resume_text"
          value={form.resume_text}
          onChange={handleChange}
          disabled={isSaving}
          rows={8}
          placeholder="Paste the full resume here..."
          className={`mt-1.5 ${inputClass}`}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="submit" size="lg" disabled={!canSubmit}>
          {isSaving ? 'Saving...' : 'Add candidate'}
        </Button>
      </div>
    </form>
  );
}

export default CandidateForm;
