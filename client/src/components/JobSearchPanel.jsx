import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Search } from 'lucide-react';
import {
  getCompanyJobDescription,
  getJobCompanies,
  searchCompanyJobs,
  searchJobs,
} from '../services/api';

/**
 * Search real openings and drop one into the job description box.
 *
 * Two sources, because they cover different ground:
 *
 *   All jobs  - Adzuna, a broad search across the Indian market. Short
 *               descriptions, but it reaches the large services employers.
 *   A company - that company's own Greenhouse board. Far fewer employers, but
 *               the full posting, which is much better material to match on.
 *
 * Collapsed by default and entirely optional: this only ever writes into the
 * textarea beside it, which the student could fill by hand.
 *
 * Picking a listing fills the field and does NOT run the match. Matching costs
 * an ML call plus a Gemini call, and on the free tier that quota is worth
 * spending deliberately - so the student stays in control of when it fires.
 */
function JobSearchPanel({ onSelectJob, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState('adzuna');
  const [companies, setCompanies] = useState([]);
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingJobId, setLoadingJobId] = useState(null);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [adzunaUnavailable, setAdzunaUnavailable] = useState(false);

  // The company list needs no credentials, so it loads regardless of whether
  // Adzuna is configured. Fetched once, when the panel is first expanded.
  useEffect(() => {
    if (!isOpen || companies.length > 0) return;
    getJobCompanies().then(setCompanies);
  }, [isOpen, companies.length]);

  const searchingAdzuna = source === 'adzuna';

  async function handleSearch(event) {
    event.preventDefault();
    if (!keywords.trim() || isSearching) return;

    setIsSearching(true);
    setError('');

    try {
      if (searchingAdzuna) {
        const { configured, results: found, error: configError } = await searchJobs(
          keywords.trim(),
          location.trim()
        );

        if (!configured) {
          // Adzuna is not set up, but company boards still are - so switch to
          // those rather than removing the whole panel.
          console.info(`Adzuna unavailable: ${configError}`);
          setAdzunaUnavailable(true);
          setSource(companies[0]?.slug ?? 'adzuna');
          setError('Broad job search is not configured. Browse a company board instead.');
          return;
        }

        setResults(found);
      } else {
        setResults(await searchCompanyJobs(source, keywords.trim(), location.trim()));
      }

      setHasSearched(true);
    } catch (searchError) {
      setError(searchError.message);
    } finally {
      setIsSearching(false);
    }
  }

  /**
   * Adzuna results arrive with their description already. Company results do
   * not - the body is fetched here, for the one posting actually chosen.
   */
  async function handleUseJob(job) {
    if (!job.needs_detail) {
      onSelectJob(job.description);
      return;
    }

    setLoadingJobId(job.id);
    setError('');

    try {
      onSelectJob(await getCompanyJobDescription(source, job.id));
    } catch (detailError) {
      setError(detailError.message);
    } finally {
      setLoadingJobId(null);
    }
  }

  return (
    <div className="rounded-ui border border-ink-200">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-50"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 text-body font-medium text-ink-900">
          <Search className="h-4 w-4 text-ink-400" aria-hidden="true" />
          Browse real openings
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-ink-400" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 text-ink-400" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-ink-200 p-4">
          <form onSubmit={handleSearch} className="flex flex-col gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-label uppercase text-ink-400">Where to look</span>
              <select
                value={source}
                onChange={(event) => {
                  setSource(event.target.value);
                  setResults([]);
                  setHasSearched(false);
                  setError('');
                }}
                disabled={disabled || isSearching}
                className="rounded-ui border border-ink-300 px-3 py-2 text-body text-ink-900 transition-colors focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600 disabled:bg-ink-50"
              >
                {!adzunaUnavailable && <option value="adzuna">All jobs (broad search)</option>}
                {companies.map((company) => (
                  <option key={company.slug} value={company.slug}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
                disabled={disabled || isSearching}
                placeholder="backend developer"
                className="flex-1 rounded-ui border border-ink-300 px-3 py-2 text-body text-ink-900 transition-colors placeholder:text-ink-400 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600 disabled:bg-ink-50"
              />
              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                disabled={disabled || isSearching}
                placeholder={searchingAdzuna ? 'Chennai (optional)' : 'Location (optional)'}
                className="rounded-ui border border-ink-300 px-3 py-2 text-body text-ink-900 transition-colors placeholder:text-ink-400 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600 disabled:bg-ink-50 sm:w-48"
              />
              <button
                type="submit"
                disabled={disabled || isSearching || !keywords.trim()}
                className="rounded-ui bg-primary-600 px-4 py-2 text-meta font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-ink-300"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {!searchingAdzuna && (
            <p className="mt-2 text-meta text-ink-400">
              Searching this company&apos;s own board. Titles are matched, so try a
              broad word like &quot;engineer&quot;.
            </p>
          )}

          {error && <p className="mt-3 text-meta text-critical-ink">{error}</p>}

          {hasSearched && results.length === 0 && !error && (
            <p className="mt-3 text-meta text-ink-500">
              No openings matched that search. Try broader keywords.
            </p>
          )}

          {results.length > 0 && (
            <ul className="mt-3 divide-y divide-ink-200">
              {results.map((job) => (
                <li key={job.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-body font-medium text-ink-900">{job.title}</p>
                      <p className="text-meta text-ink-500">
                        {job.company}
                        {job.location ? ` - ${job.location}` : ''}
                      </p>
                      {job.snippet && (
                        <p className="mt-1 text-meta text-ink-500">{job.snippet}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleUseJob(job)}
                        disabled={disabled || loadingJobId === job.id}
                        className="whitespace-nowrap rounded-ui border border-ink-300 px-3 py-1.5 text-meta font-medium text-ink-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loadingJobId === job.id ? 'Loading...' : 'Use this job'}
                      </button>
                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-meta text-ink-400 transition-colors hover:text-primary-700"
                        >
                          View posting
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default JobSearchPanel;
