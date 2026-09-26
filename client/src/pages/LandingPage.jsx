import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Gauge,
  ListChecks,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import ScoreCardMock from '../components/ScoreCardMock';
import useReveal from '../components/useReveal';

/**
 * The front door.
 *
 * Two audiences use HireScope for opposite reasons, and a single generic
 * "get started" would serve neither. A student checking their own resume gets
 * the primary card because that is who the tool is being validated with today;
 * a placement cell screening a pool gets the secondary one.
 *
 * The hero puts a mock of the actual output beside the headline rather than
 * describing it: the product is a score card, so showing one says more than a
 * paragraph can. Everything below the fold reveals on scroll.
 *
 * lucide dropped brand icons in v1, so GitHub and LinkedIn are inline SVG
 * rather than an extra dependency for two glyphs.
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

/**
 * The bento grid. Varied spans rather than three equal columns, so the eye has
 * somewhere to land first instead of scanning three identical boxes.
 */
const FEATURES = [
  {
    Icon: Gauge,
    title: 'A fit score that reads meaning',
    body: 'Both texts become sentence embeddings and are compared directly, so a resume describing the same work in different words still scores well. You see the raw similarity, not just the number sitting on top of it.',
    span: 'sm:col-span-3',
    tone: 'primary',
  },
  {
    Icon: ListChecks,
    title: 'A skills diff, not a keyword count',
    body: 'Around 60 real tech skills, matched against the posting. You see which ones your resume evidences and which it does not.',
    span: 'sm:col-span-3',
    tone: 'plain',
  },
  {
    Icon: MessageSquareQuote,
    title: 'Questions written for you',
    body: 'Three interview questions drawn from your own projects and the gaps between them.',
    span: 'sm:col-span-2',
    tone: 'plain',
  },
  {
    Icon: Sparkles,
    title: 'Practice, then apply',
    body: 'Answer each question and get specific feedback, then draft a cover letter grounded only in what your resume actually says.',
    span: 'sm:col-span-2',
    tone: 'plain',
  },
  {
    Icon: ShieldCheck,
    title: 'Nothing is stored',
    body: 'The student flow keeps no record. Your resume is read, scored, and forgotten.',
    span: 'sm:col-span-2',
    tone: 'plain',
  },
];

function FeatureCard({ Icon, title, body, span, tone, index }) {
  const [ref, isVisible] = useReveal();

  const surface =
    tone === 'primary'
      ? 'border-primary-200/70 bg-gradient-to-br from-primary-50 to-white dark:border-primary-800/60 dark:from-primary-900/30 dark:to-ink-950'
      : 'border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950';

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 70}ms` }}
      className={`${span} rounded-panel border p-6 shadow-card transition-all duration-700 ease-out hover:-translate-y-1 hover:shadow-lifted ${surface} ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-ui bg-primary-600 text-white shadow-card">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-display text-subheading text-ink-900 dark:text-ink-100">{title}</h3>
      <p className="mt-2 text-meta text-ink-500 dark:text-ink-400">{body}</p>
    </div>
  );
}

function LandingPage() {
  const [gridRef, gridVisible] = useReveal();
  const [footerRef, footerVisible] = useReveal();

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-50 dark:bg-ink-975">
      {/* ---- Gradient mesh. Three blurred blobs in primary and accent, two of
              them drifting slowly out of phase so the background is alive
              without ever asking to be looked at. Decorative, so hidden from
              assistive tech and never intercepting a click. ---- */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[760px] overflow-hidden"
      >
        <div className="absolute -left-40 -top-56 h-[560px] w-[760px] rounded-full bg-primary-300/45 blur-3xl motion-safe:animate-drift dark:bg-primary-700/30" />
        <div className="absolute -right-32 -top-32 h-[460px] w-[620px] rounded-full bg-accent-300/40 blur-3xl motion-safe:animate-driftSlow dark:bg-accent-700/30" />
        <div className="absolute left-1/3 top-24 h-[340px] w-[520px] rounded-full bg-primary-100/60 blur-3xl dark:bg-accent-900/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-50 dark:to-ink-975" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
        {/* ---- Hero: headline beside a mock of the real output ---- */}
        <header className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span
              style={{ animationDelay: '0ms' }}
              className="motion-safe:animate-fadeUp inline-flex items-center gap-2 rounded-full border border-primary-200/80 bg-white/70 px-3 py-1.5 text-label uppercase text-primary-700 backdrop-blur dark:border-primary-800 dark:bg-ink-950/70 dark:text-primary-300"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Built for students, not recruiters
            </span>

            <h1
              style={{ animationDelay: '90ms' }}
              className="motion-safe:animate-fadeUp mt-6 font-display text-hero text-ink-900 dark:text-ink-50"
            >
              Find out how your resume actually reads
            </h1>

            <p
              style={{ animationDelay: '180ms' }}
              className="motion-safe:animate-fadeUp mt-6 max-w-xl text-body text-ink-600 dark:text-ink-400"
            >
              Score it against a real job description, see which skills land and which
              are missing, and get the questions you are likely to be asked.
            </p>

            {/* ---- The two paths ---- */}
            <div className="mt-10 grid gap-4 sm:grid-cols-5">
              <Link
                to="/check-resume"
                style={{ animationDelay: '270ms' }}
                className="motion-safe:animate-fadeUp group relative flex flex-col justify-between rounded-panel border border-primary-200 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-primary-400 hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 dark:border-primary-800 dark:bg-ink-950 dark:focus-visible:ring-offset-ink-975 sm:col-span-3"
              >
                <div>
                  <span className="text-label uppercase text-primary-700 dark:text-primary-300">
                    Start here
                  </span>
                  <h2 className="mt-2 font-display text-subheading text-ink-900 dark:text-ink-100">
                    Check my resume
                  </h2>
                  <p className="mt-2 text-meta text-ink-600 dark:text-ink-400">
                    Get an honest score, the specific things to fix, and practice
                    questions for the job you are targeting.
                  </p>
                </div>

                <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-ui bg-primary-600 px-4 py-2.5 text-meta font-semibold text-white shadow-card transition-colors group-hover:bg-primary-700">
                  Check my resume
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>

              <Link
                to="/match"
                style={{ animationDelay: '340ms' }}
                className="motion-safe:animate-fadeUp group flex flex-col justify-between rounded-panel border border-ink-200 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-ink-300 hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 dark:border-ink-800 dark:bg-ink-950 dark:focus-visible:ring-offset-ink-975 sm:col-span-2"
              >
                <div>
                  <span className="text-label uppercase text-ink-400">For recruiters</span>
                  <h2 className="mt-2 font-display text-subheading text-ink-900 dark:text-ink-100">
                    Match candidates
                  </h2>
                  <p className="mt-2 text-meta text-ink-600 dark:text-ink-400">
                    Paste one job description and rank your whole candidate pool
                    against it at once.
                  </p>
                </div>

                <span className="mt-5 inline-flex w-fit items-center gap-2 text-meta font-semibold text-ink-700 transition-colors group-hover:text-primary-700 dark:text-ink-300 dark:group-hover:text-primary-300">
                  Match candidates
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </div>
          </div>

          {/* The product, shown rather than described. */}
          <div
            style={{ animationDelay: '220ms' }}
            className="motion-safe:animate-fadeUp flex justify-center lg:col-span-5 lg:justify-end"
          >
            <ScoreCardMock />
          </div>
        </header>

        {/* ---- How it works, as a bento grid ---- */}
        <section className="mt-28">
          <div
            ref={gridRef}
            className={`transition-all duration-700 ease-out ${
              gridVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            <h2 className="text-label uppercase text-ink-400">How it works</h2>
            <p className="mt-2 max-w-2xl font-display text-heading text-ink-900 dark:text-ink-100">
              Three separate signals, each one you can check for yourself.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-6">
            {FEATURES.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </section>

        {/* ---- Why, and who ---- */}
        <footer
          ref={footerRef}
          className={`mt-24 border-t border-ink-200 pt-10 transition-all duration-700 ease-out dark:border-ink-800 ${
            footerVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <p className="max-w-xl text-body text-ink-600 dark:text-ink-400">
            I kept sending out resumes with no idea whether they were any good, and so
            did everyone I studied with. This is the tool I wanted then.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span className="text-meta text-ink-500">Built by Harsh Singh</span>

            <span aria-hidden="true" className="text-ink-300 dark:text-ink-700">
              &middot;
            </span>

            <a
              href="https://github.com/harshhhhss"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-ui text-meta text-ink-500 transition-colors hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 dark:hover:text-primary-300 dark:focus-visible:ring-offset-ink-975"
            >
              <GithubIcon className="h-4 w-4" />
              GitHub
            </a>

            <a
              href="https://linkedin.com/in/harsh-singh-14a730321"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-ui text-meta text-ink-500 transition-colors hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 dark:hover:text-primary-300 dark:focus-visible:ring-offset-ink-975"
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
