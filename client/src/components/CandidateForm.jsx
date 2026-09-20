import { useState } from 'react';

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

  const inputClass =
    'mt-1.5 w-full rounded-ui border border-ink-300 p-2.5 text-body text-ink-900 transition-colors placeholder:text-ink-400 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600 disabled:bg-ink-50';

  return (
    <form onSubmit={handleSubmit} className="rounded-ui border border-ink-200 bg-white p-6">
      <h2 className="text-heading text-ink-900">Add a candidate</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-meta font-medium text-ink-700">
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
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-meta font-medium text-ink-700">
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
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="resume_text" className="block text-meta font-medium text-ink-700">
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
          className={inputClass}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-ui bg-primary-600 px-5 py-2.5 text-meta font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-ink-300"
        >
          {isSaving ? 'Saving...' : 'Add candidate'}
        </button>
      </div>
    </form>
  );
}

export default CandidateForm;
