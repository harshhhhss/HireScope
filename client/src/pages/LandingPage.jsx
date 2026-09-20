import { Link } from 'react-router-dom';
import { ArrowRight, Gauge, ListChecks, MessageSquareQuote, ScanSearch } from 'lucide-react';

/**
 * The front door.
 *
 * Two audiences use HireScope for opposite reasons, and a single generic
 * "get started" would serve neither. A student checking their own resume gets
 * the primary card because that is who the tool is being validated with today;
 * a placement cell screening a pool gets the secondary one. Both are one click.
 *
 * lucide dropped brand icons in v1, so GitHub and LinkedIn are inline SVG
 * below rather than an extra dependency for two glyphs.
 */

function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2.17c-3.2.7-3.88-1.38-3.88-1.38-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.5 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function LinkedinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

const HOW_IT_WORKS = [
  {
    Icon: Gauge,
    title: 'A fit score that reads meaning',
    body: 'Both texts are turned into sentence embeddings and compared, so a resume that describes the same work in different words still scores well.',
  },
  {
    Icon: ListChecks,
    title: 'A skills diff, not a keyword count',
    body: 'Against a taxonomy of around 60 real tech skills, you see exactly which the posting asks for that your resume evidences, and which it does not.',
  },
  {
    Icon: MessageSquareQuote,
    title: 'Questions written for you',
    body: 'Three interview questions drawn from your actual projects and the gaps in between, so you can practise the conversation before you have it.',
  },
];

function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-50">
      {/* Depth behind the hero. Two soft, heavily blurred blobs in the brand
          colour rather than a flat white page. Purely decorative, so they are
          hidden from assistive tech and never intercept a click. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[520px] overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary-200/50 blur-3xl" />
        <div className="absolute -top-10 right-1/4 h-[260px] w-[380px] rounded-full bg-primary-100/60 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ink-50" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-24">
        {/* ---- Hero ---- */}
        <header className="motion-safe:animate-fadeUp text-center">
          <span className="inline-flex items-center gap-2 rounded-ui border border-primary-200 bg-white/70 px-3 py-1.5 text-label uppercase text-primary-700 backdrop-blur">
            <ScanSearch className="h-3.5 w-3.5" aria-hidden="true" />
            HireScope
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl text-title text-ink-900 sm:text-display">
            Find out how your resume actually reads
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-body text-ink-600">
            Score a resume against a real job description, see which skills land and
            which are missing, and get the questions you are likely to be asked.
          </p>
        </header>

        {/* ---- The two paths ---- */}
        <div className="mt-12 grid gap-4 sm:grid-cols-5">
          {/* Primary: the student. Wider, filled, and first in reading order. */}
          <Link
            to="/check-resume"
            style={{ animationDelay: '80ms' }}
            className="motion-safe:animate-fadeUp group relative flex flex-col justify-between rounded-ui border border-primary-200 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary-400 hover:shadow-lg sm:col-span-3"
          >
            <div>
              <span className="text-label uppercase text-primary-700">Start here</span>
              <h2 className="mt-2 text-heading text-ink-900">Check my resume</h2>
              <p className="mt-2 text-body text-ink-600">
                You are a student about to apply somewhere. Paste or upload your resume
                and get an honest score, the specific things to fix, and practice
                questions for the job you are targeting.
              </p>
            </div>

            <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-ui bg-primary-600 px-4 py-2.5 text-meta font-semibold text-white transition-colors group-hover:bg-primary-700">
              Check my resume
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>

          {/* Secondary: the placement cell. Quieter, but not hidden. */}
          <Link
            to="/match"
            style={{ animationDelay: '160ms' }}
            className="motion-safe:animate-fadeUp group flex flex-col justify-between rounded-ui border border-ink-200 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-ink-300 hover:shadow-lg sm:col-span-2"
          >
            <div>
              <span className="text-label uppercase text-ink-400">For recruiters</span>
              <h2 className="mt-2 text-heading text-ink-900">Match candidates</h2>
              <p className="mt-2 text-body text-ink-600">
                Screening for a placement cell or a role. Paste one job description and
                rank every candidate in your pool against it at once.
              </p>
            </div>

            <span className="mt-5 inline-flex w-fit items-center gap-2 text-meta font-semibold text-ink-700 transition-colors group-hover:text-primary-700">
              Match candidates
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>
        </div>

        {/* ---- How it works ---- */}
        <section className="mt-20">
          <h2 className="text-label uppercase text-ink-400">How it works</h2>

          <div className="mt-5 grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ Icon, title, body }) => (
              <div key={title}>
                <span className="flex h-9 w-9 items-center justify-center rounded-ui bg-primary-50 text-primary-700">
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-body font-semibold text-ink-900">{title}</h3>
                <p className="mt-1.5 text-meta text-ink-500">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- Why, and who ---- */}
        <footer className="mt-20 border-t border-ink-200 pt-8">
          <p className="max-w-xl text-body text-ink-600">
            I kept sending out resumes with no idea whether they were any good, and so
            did everyone I studied with. This is the tool I wanted then.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <span className="text-meta text-ink-500">Built by Harsh Singh</span>

            <span aria-hidden="true" className="text-ink-300">
              &middot;
            </span>

            <a
              href="https://github.com/harshhhhss"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-meta text-ink-500 transition-colors hover:text-primary-700"
            >
              <GithubIcon className="h-4 w-4" />
              GitHub
            </a>

            <a
              href="https://linkedin.com/in/harsh-singh-14a730321"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-meta text-ink-500 transition-colors hover:text-primary-700"
            >
              <LinkedinIcon className="h-4 w-4" />
              LinkedIn
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default LandingPage;
