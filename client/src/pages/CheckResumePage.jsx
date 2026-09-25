import { useEffect, useState } from 'react';
import { matchMyResume, scoreResume } from '../services/api';
import ResumeInput from '../components/ResumeInput';
import ScoreRing from '../components/ScoreRing';
import SkillTags from '../components/SkillTags';
import FitScoreBadge from '../components/FitScoreBadge';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import { Check, FileSearch } from 'lucide-react';
import ProgressTrend from '../components/ProgressTrend';
import JobSearchPanel from '../components/JobSearchPanel';
import PracticeQuestion from '../components/PracticeQuestion';
import CoverLetterDraft from '../components/CoverLetterDraft';
import ScoreBreakdown from '../components/ScoreBreakdown';
import MethodologyNote from '../components/MethodologyNote';
import { appendScore, clearHistory, readHistory } from '../services/resumeHistory';

/**
 * The self-service flow: one person checking their own resume.
 *
 * Deliberately staged rather than showing everything at once. You paste or
 * upload a resume and get a quality score. Only then does the optional
 * "target a job" step appear, because until there is a resume there is nothing
 * to target, and showing both at once gives you two things to think about when
 * you only needed one.
 *
 * Nothing here writes to the database - see server/controllers/resumeController.js.
 */
function CheckResumePage() {
  const [resumeText, setResumeText] = useState('');

  // Step 1: the standalone quality score.
  const [quality, setQuality] = useState(null);
  const [isScoring, setIsScoring] = useState(false);
  const [scoreError, setScoreError] = useState('');

  // Past scores from this browser. Loaded once on mount; localStorage may be
  // unavailable, in which case this stays empty and the trend never renders.
  const [history, setHistory] = useState([]);
  useEffect(() => {
    setHistory(readHistory());
  }, []);

  // Step 2: the optional match against a specific job.
  const [jobDescription, setJobDescription] = useState('');
  const [fit, setFit] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchError, setMatchError] = useState('');

  const canScore = resumeText.trim().length > 0 && !isScoring;
  const canMatch = jobDescription.trim().length > 0 && !isMatching;

  async function handleScore() {
    if (!canScore) return;

    setIsScoring(true);
    setScoreError('');
    // Clear any previous job match too: it belonged to the old resume text.
    setFit(null);
    setMatchError('');

    try {
      const result = await scoreResume(resumeText.trim());
      setQuality(result);
      // Record it so the next check can show a delta. appendScore returns the
      // updated list, so there is no second read and no crash if storage fails.
      setHistory(appendScore(result.overall_score));
    } catch (error) {
      setScoreError(error.message);
      setQuality(null);
    } finally {
      setIsScoring(false);
    }
  }

  async function handleMatch() {
    if (!canMatch) return;

    setIsMatching(true);
    setMatchError('');

    try {
      setFit(await matchMyResume(resumeText.trim(), jobDescription.trim()));
    } catch (error) {
      setMatchError(error.message);
      setFit(null);
    } finally {
      setIsMatching(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* ---- Header ---- */}
      <header>
        <h1 className="text-title text-ink-900">How good is your resume?</h1>
        <p className="mt-2 text-body text-ink-500">
          Paste it in or upload a file. You will get an honest score, what is working,
          and exactly what to fix - before you send it anywhere.
        </p>
      </header>

      {/* ---- Step 1: the resume ---- */}
      <section className="rounded-ui border border-ink-200 bg-white p-6">
        <h2 className="text-heading text-ink-900">Your resume</h2>

        <div className="mt-4">
          <ResumeInput value={resumeText} onChange={setResumeText} disabled={isScoring} />
        </div>

        <Alert type="error" message={scoreError} onDismiss={() => setScoreError('')} />

        <button
          type="button"
          onClick={handleScore}
          disabled={!canScore}
          className="mt-5 w-full rounded-ui bg-primary-600 px-5 py-2.5 text-meta font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-ink-300 sm:w-auto"
        >
          {isScoring ? 'Reading your resume...' : 'Check my resume'}
        </button>

        {isScoring && (
          <p className="mt-2 text-meta text-ink-500">
            This usually takes a few seconds.
          </p>
        )}
      </section>

      {/* ---- Empty state: shown until the first analysis lands ---- */}
      {!quality && !isScoring && (
        <EmptyState
          icon={FileSearch}
          title="Your score will appear here"
          description="Add your resume above and hit Check my resume. Nothing you paste here is saved or added to any recruiter's list."
        />
      )}

      {/* ---- Step 1 result ---- */}
      {quality && (
        <section className="space-y-7 rounded-ui border border-ink-200 bg-white p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
            <ScoreRing score={quality.overall_score} />

            <div className="flex-1">
              <h2 className="text-heading text-ink-900">Here is what I found</h2>
              <p className="mt-1 text-body text-ink-500">
                Scored on concrete impact, evidence of real projects, and how quickly
                someone can scan it.
              </p>
            </div>
          </div>

          {quality.strengths.length > 0 && (
            <div>
              <h3 className="text-label uppercase text-ink-400">What is working</h3>
              <ul className="mt-2 divide-y divide-ink-200">
                {quality.strengths.map((item, index) => (
                  <li key={index} className="flex gap-3 py-3 text-body text-ink-700">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-good" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ProgressTrend history={history} onClear={() => setHistory(clearHistory())} />

          {quality.improvements.length > 0 && (
            <div>
              <h3 className="text-label uppercase text-ink-400">What to fix next</h3>
              <ol className="mt-2 divide-y divide-ink-200">
                {quality.improvements.map((item, index) => (
                  <li key={index} className="flex gap-3 py-3 text-body text-ink-700">
                    <span className="text-meta font-semibold tabular-nums text-ink-400">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}

      {/* ---- Step 2: optional, and only once there is a score ---- */}
      {quality && (
        <section className="rounded-ui border border-ink-200 bg-white p-6">
          <h2 className="text-heading text-ink-900">Applying somewhere specific?</h2>
          <p className="mt-1 text-body text-ink-500">
            Optional. Paste the job description and I will show how your resume lines up,
            which skills are missing, and what they are likely to ask you.
          </p>

          <div className="mt-4">
            <JobSearchPanel onSelectJob={setJobDescription} disabled={isMatching} />
          </div>

          <textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            disabled={isMatching}
            rows={7}
            placeholder="Paste the job description here..."
            className="mt-4 w-full rounded-ui border border-ink-300 p-3 text-body text-ink-900 transition-colors placeholder:text-ink-400 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600 disabled:bg-ink-50"
          />

          <Alert type="error" message={matchError} onDismiss={() => setMatchError('')} />

          <button
            type="button"
            onClick={handleMatch}
            disabled={!canMatch}
            className="mt-5 w-full rounded-ui bg-primary-600 px-5 py-2.5 text-meta font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-ink-300 sm:w-auto"
          >
            {isMatching ? 'Comparing...' : 'Compare with this job'}
          </button>

          {isMatching && (
            <p className="mt-2 text-meta text-ink-500">
              Scoring the match and writing practice questions - a few seconds.
            </p>
          )}
        </section>
      )}

      {/* ---- Step 2 result ---- */}
      {fit && (
        <section className="space-y-7 rounded-ui border border-ink-200 bg-white p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-heading text-ink-900">How you match this job</h2>
              <p className="mt-1 text-body text-ink-500">
                Based on how closely your resume reads like the posting.
              </p>
            </div>
            {/* The score is the point of this card, so it gets the headline
                treatment rather than sitting in the corner as a chip. */}
            <FitScoreBadge score={fit.fit_score} variant="headline" />
          </div>

          {fit.warning && <Alert type="info" message={fit.warning} />}

          <ScoreBreakdown
            fitScore={fit.fit_score}
            similarity={fit.similarity}
            topMatches={fit.top_matches}
            matchedSkills={fit.matched_skills}
            missingSkills={fit.missing_skills}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="text-label uppercase text-ink-400">Skills you already have</h3>
              <div className="mt-2">
                <SkillTags
                  skills={fit.matched_skills}
                  variant="matched"
                  emptyText="No direct overlap with this posting"
                />
              </div>
            </div>

            <div>
              <h3 className="text-label uppercase text-ink-400">Areas to develop</h3>
              <div className="mt-2">
                <SkillTags
                  skills={fit.missing_skills}
                  variant="missing"
                  emptyText="Nothing missing - you cover the posting"
                />
              </div>
            </div>
          </div>

          {fit.interview_questions.length > 0 && (
            <div>
              <h3 className="text-label uppercase text-ink-400">
                Practise these before you apply
              </h3>
              <ol className="mt-2 divide-y divide-ink-200">
                {fit.interview_questions.map((question, index) => (
                  <PracticeQuestion
                    key={index}
                    index={index}
                    question={question}
                    resumeText={resumeText.trim()}
                    missingSkills={fit.missing_skills}
                  />
                ))}
              </ol>
            </div>
          )}

          <CoverLetterDraft
            resumeText={resumeText.trim()}
            jobDescription={jobDescription.trim()}
            matchedSkills={fit.matched_skills}
          />
        </section>
      )}
    </div>
  );
}

export default CheckResumePage;
