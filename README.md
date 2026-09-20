# HireScope

Resume-to-job matching. You paste a job description, HireScope scores every
candidate's resume against it, tells you which required skills each person has
and lacks, and drafts three interview questions tailored to that person.

## Architecture

Two services that talk over HTTP:

```
  client (React, :3000)
        |
        v
  Node API  ── POST /match ──▶  Python ML service   (embeddings + skills diff)
  :5000     ── generateContent ▶  Gemini API        (interview questions)
        |
        v
    MongoDB
```

| Service            | Stack                                | Port  | Responsibility                                    |
| ------------------ | ------------------------------------ | ----- | ------------------------------------------------- |
| [`server/`](server/)         | Node, Express, Mongoose    | 5000  | REST API, orchestration, persistence              |
| [`ml-service/`](ml-service/) | Python, Flask, sentence-transformers | 5001  | Fit score + skills matching             |
| [`client/`](client/)         | React, Vite, Tailwind      | 3000  | Recruiter UI + self-service resume check          |

The split exists because the scoring is a Python job — `sentence-transformers`
has no real Node equivalent — while the API, auth and database work is more
natural in Node. Keeping the ML in its own process also means you can restart
the API without reloading the model.

## The match pipeline

`POST /api/v1/match` runs three steps per candidate:

1. **Fit score & skills** — [`server/services/matchService.js`](server/services/matchService.js)
   posts the job description and the resume to the Python service, which embeds
   both texts with `all-MiniLM-L6-v2`, takes their cosine similarity as a 0–100
   `fit_score`, and diffs a ~60-skill taxonomy to produce `matched_skills` and
   `missing_skills`.
2. **Interview questions** — [`server/services/aiService.js`](server/services/aiService.js)
   sends the resume plus those `missing_skills` to Gemini and asks for exactly
   three questions: one about work the candidate actually did, two probing the
   gaps.
3. **Persist** — [`server/controllers/matchController.js`](server/controllers/matchController.js)
   writes all four fields onto the Candidate document and returns the batch
   sorted by `fit_score`.

If Gemini fails, the scores are still saved and returned with a `warning` — the
questions are a bonus, not a reason to lose the match. If one candidate errors,
the rest of the batch still completes.

## Running it locally

You need three terminals: MongoDB, the ML service, and the Node API.

### 1. MongoDB

Have `mongod` running locally, or point `MONGO_URI` at an Atlas cluster.

### 2. ML service (port 5001)

```bash
cd ml-service
py -3.12 -m venv venv          # see ml-service/README.md on Python versions
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python app.py
```

First start downloads the ~90 MB model. Details in
[`ml-service/README.md`](ml-service/README.md).

### 3. Node API (port 5000)

```bash
cd server
npm install
cp .env.example .env           # then fill in GEMINI_API_KEY
npm run dev
```

`.env` values:

| Variable         | Purpose                                     | Default                              |
| ---------------- | ------------------------------------------- | ------------------------------------ |
| `MONGO_URI`      | MongoDB connection string                    | `mongodb://127.0.0.1:27017/hirescope` |
| `PORT`           | Node API port                                | `5000`                               |
| `ML_SERVICE_URL` | Where the Python service is listening        | `http://localhost:5001`              |
| `GEMINI_API_KEY` | From <https://aistudio.google.com/app/apikey> | *(required)*                        |
| `GEMINI_MODEL`   | Gemini model id                              | `gemini-flash-lite-latest`           |
| `ADZUNA_APP_ID`  | Adzuna app id, free at <https://developer.adzuna.com/> | *(optional)*               |
| `ADZUNA_APP_KEY` | Adzuna app key                               | *(optional)*                         |
| `ADZUNA_COUNTRY` | Adzuna country code                          | `in`                                 |

### 4. React client (port 3000)

```bash
cd client
npm install
npm run dev
```

Opens <http://localhost:3000>. It talks to the Node API at
`http://localhost:5000` by default; override with `VITE_API_URL` in
`client/.env` if the API runs elsewhere.

There are two flows in the UI:

- **Recruiter** - add candidates on the **Candidates** tab, then paste a posting
  on the **Match** tab and hit *Match candidates*. Click *View* on any row to
  read that person's three interview questions.
- **Student** - the **Check my resume** tab. Upload a PDF/DOCX or paste your
  resume, get a quality score with specific fixes, then optionally paste a job
  description - or search real openings - to see how you line up. From there you
  can practise each interview question and get feedback on your answer, and
  draft a cover letter. Nothing on this tab is saved server-side; the score
  history shown under "Your progress" lives in your browser's localStorage.

### Gemini model and free-tier limits

`GEMINI_MODEL` defaults to `gemini-flash-lite-latest`. Two deliberate choices:

- **An alias, not a pinned version.** Google retires specific versions, and a
  pinned model starts returning `404 ... is no longer available`. The alias
  always resolves to a current model.
- **The "lite" tier.** Writing three questions does not need a frontier model,
  and the flagship `gemini-flash-latest` alias frequently answers
  `503 high demand` on the free tier.

Two failure modes worth recognising in the server log:

| Log line | Meaning | What the app does |
| --- | --- | --- |
| `Gemini API returned 503` | Model temporarily overloaded | Retries with exponential backoff (2s, 4s, 8s) |
| `Gemini API returned 429 ... Quota exceeded` | Free-tier request limit hit | Waits the `retryDelay` the API asks for, then retries |

Either way the match still succeeds: `fit_score`, `matched_skills` and
`missing_skills` are saved, and the result carries a `warning` explaining that
questions were unavailable. The UI surfaces that as a blue notice.

## API reference

### `POST /api/v1/candidates`

Add a resume to the database.

```bash
curl -X POST http://localhost:5000/api/v1/candidates \
  -H "Content-Type: application/json" \
  -d '{"name":"Harsh Singh","email":"harsh@example.com","resume_text":"Built REST APIs in Python (Flask) and Node.js/Express. Used MongoDB. Deployed with Docker on AWS."}'
```

### `GET /api/v1/candidates`

List all candidates, highest `fit_score` first.

### `POST /api/v1/match`

Score candidates against a job description. Omit `candidate_ids` to score
everyone in the database.

```bash
curl -X POST http://localhost:5000/api/v1/match \
  -H "Content-Type: application/json" \
  -d '{"job_description":"Senior Backend Engineer. Strong Python and Node.js, MongoDB, Docker, Kubernetes and AWS."}'
```

Response:

```json
{
  "success": true,
  "matched": 1,
  "results": [
    {
      "_id": "66f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Harsh Singh",
      "email": "harsh@example.com",
      "fit_score": 72.14,
      "matched_skills": ["AWS", "Docker", "MongoDB", "Node.js", "Python"],
      "missing_skills": ["Kubernetes"],
      "interview_questions": [
        "You deployed with Docker on AWS — walk me through how you handled configuration between environments.",
        "You have not worked with Kubernetes; how would you take one of your Docker services and run it on a cluster?",
        "How would you decide when a workload justifies Kubernetes over plain containers?"
      ]
    }
  ]
}
```

## Self-service API (student flow)

These three endpoints back the **Check my resume** page. None of them touch the
`Candidate` collection: a student checking their own CV never appears in a
recruiter's candidate list.

### `POST /api/v1/resume/score`

Rate a resume on its own. No job description, nothing saved.

```bash
curl -X POST http://localhost:5000/api/v1/resume/score   -H "Content-Type: application/json"   -d '{"resume_text":"Harsh Singh, Backend Engineer. DevPilot AI: built the backend in Python with FastAPI, MongoDB for storage, Redis cache. Docker on AWS EC2."}'
```

Response:

```json
{
  "success": true,
  "overall_score": 42,
  "strengths": [
    "Clearly names relevant technologies like FastAPI, MongoDB, and Redis in the DevPilot AI project."
  ],
  "improvements": [
    "Add a quantified metric to the DevPilot AI project showing latency reduction or throughput improvement.",
    "Remove React from the Skills section since no frontend work is mentioned in either project."
  ]
}
```

The prompt pushes hard against generic filler, so `improvements` name the exact
project or section to change rather than saying "add more detail".

### `POST /api/v1/resume/upload`

Send a PDF or DOCX as multipart form data in a field named `resume`, get the
extracted plain text back. Does no analysis, so a failed upload costs no Gemini
quota. Used by the student flow, and equally usable for candidate creation.

```bash
curl -X POST http://localhost:5000/api/v1/resume/upload   -F "resume=@/path/to/resume.pdf"
```

Response:

```json
{
  "success": true,
  "resume_text": "Harsh Singh - Backend Engineer
Built REST APIs in Python with Flask and FastAPI.",
  "characters": 112,
  "format": "pdf",
  "filename": "resume.pdf"
}
```

Limits: **PDF and DOCX only, 5MB maximum.** Anything else is rejected with a
plain-English message - an old binary `.doc`, for example, is told to re-save as
`.docx`. A scanned PDF with no text layer is caught too, rather than returning a
handful of stray characters.

### `POST /api/v1/resume/match`

The same pipeline `POST /api/v1/match` runs, but against one resume held in the
request instead of the stored candidate pool, and with no database write.

```bash
curl -X POST http://localhost:5000/api/v1/resume/match   -H "Content-Type: application/json"   -d '{"resume_text":"Python, FastAPI, MongoDB, Docker on AWS.","job_description":"Backend Engineer. Python, Node.js, MongoDB, Docker, Kubernetes, AWS. C++ and CI/CD a plus."}'
```

Response:

```json
{
  "success": true,
  "fit_score": 60.16,
  "matched_skills": ["AWS", "Docker", "MongoDB", "Node.js", "Python"],
  "missing_skills": ["C++", "CI/CD", "Kubernetes", "PostgreSQL"],
  "interview_questions": [
    "Can you walk me through how you structured the FastAPI backend and handled caching with Redis in your project DevPilot AI?"
  ]
}
```

Interview questions are the optional half here, exactly as in the recruiter
flow: if Gemini is rate limited you still get `fit_score` and both skill lists,
plus a `warning` field explaining what was skipped.

### `POST /api/v1/resume/interview-feedback`

Grade one practice answer to one interview question. Saves nothing.

```bash
curl -X POST http://localhost:5000/api/v1/resume/interview-feedback \
  -H "Content-Type: application/json" \
  -d '{"question":"How would you design a Kubernetes deployment strategy?","answer":"I am a fast learner and could pick it up quickly.","resume_text":"Backend engineer. Python, FastAPI, MongoDB, Docker on AWS EC2.","missing_skills":["Kubernetes","CI/CD"]}'
```

Response:

```json
{
  "success": true,
  "verdict": "off target",
  "summary": "The candidate avoided the technical question entirely, offering generic enthusiasm instead of addressing Kubernetes deployment strategies or their skill gap.",
  "suggestions": [
    "Acknowledge your lack of production Kubernetes experience directly, referencing how your Docker and AWS EC2 background translates to container orchestration concepts.",
    "Avoid relying on soft skills like being a 'fast learner' when asked a specific architectural and tooling question."
  ]
}
```

`verdict` is always one of `strong`, `needs work` or `off target`. The prompt
specifically looks for answers that dodge a skill gap rather than admitting it,
because that is the most common way a screening call goes wrong.

### `POST /api/v1/resume/cover-letter`

Draft a cover letter grounded in the resume and the posting. Saves nothing.

```bash
curl -X POST http://localhost:5000/api/v1/resume/cover-letter \
  -H "Content-Type: application/json" \
  -d '{"resume_text":"Backend engineer. Python, FastAPI, MongoDB, Docker on AWS EC2.","job_description":"Backend Engineer. Python, Node.js, MongoDB, Docker, Kubernetes, AWS.","matched_skills":["Python","MongoDB","Docker","AWS"]}'
```

Response:

```json
{
  "success": true,
  "cover_letter": "Dear Hiring Manager,\n\nI am writing to apply for the Backend Engineer position...\n\nSincerely,\nHarsh Singh"
}
```

Every claim has to be traceable to the resume. The prompt forbids generic filler
and forbids mentioning skills the candidate does not have, so a posting asking
for Kubernetes will not produce a letter claiming Kubernetes experience.

## Job search API

### `GET /api/v1/jobs/search`

Search real openings via [Adzuna](https://developer.adzuna.com/), used to
autofill a job description on the **Check my resume** page.

```bash
curl "http://localhost:5000/api/v1/jobs/search?q=backend%20developer&location=Chennai"
```

Response:

```json
{
  "success": true,
  "configured": true,
  "count": 10,
  "results": [
    {
      "id": "4912345678",
      "title": "Backend Developer",
      "company": "Example Technologies",
      "location": "Chennai, Tamil Nadu",
      "snippet": "We are looking for a backend developer with strong Python...",
      "description": "full posting text, used to autofill the match flow",
      "url": "https://www.adzuna.in/details/4912345678",
      "created": "2026-09-14T09:12:00Z"
    }
  ]
}
```

`q` is required; `location` is optional. Credentials stay server-side - the
browser never sees them.

**When Adzuna is not configured** the endpoint answers `503` with
`configured: false`, and the client hides the panel rather than showing a
search box that cannot work:

```json
{
  "success": false,
  "configured": false,
  "error": "Job search is not configured. Add ADZUNA_APP_ID and ADZUNA_APP_KEY to server/.env - free keys at https://developer.adzuna.com/"
}
```

Pasting a job description by hand works with or without Adzuna.

## Project layout

```
HireScope/
├── ml-service/
│   ├── app.py                 Flask app: POST /match
│   ├── skills.py              ~60-skill taxonomy (canonical name → aliases)
│   ├── requirements.txt
│   └── README.md
├── server/
│   ├── server.js              Express app, middleware, startup
│   ├── config/db.js           Mongoose connection
│   ├── models/Candidate.js    Candidate schema
│   ├── routes/                index.js, candidateRoutes.js, matchRoutes.js,
│   │                          resumeRoutes.js, jobRoutes.js
│   ├── controllers/           matchController.js, candidateController.js,
│   │                          resumeController.js, jobController.js
│   ├── services/
│   │   ├── matchService.js       HTTP client for the Python ML service
│   │   ├── aiService.js          Gemini: questions, resume scoring, answer
│   │   │                         feedback, cover letters
│   │   ├── jobSearchService.js   Adzuna job search client
│   │   └── resumeTextService.js  PDF/DOCX -> plain text
│   └── .env.example
└── client/
    ├── src/
    │   ├── services/          api.js (every HTTP call), resumeHistory.js
    │   │                      (score history in localStorage)
    │   ├── components/        SkillTags, FitScoreBadge, ScoreRing, ResultsTable,
    │   │                      CandidateDetailModal, ResumeInput, ProgressTrend,
    │   │                      JobSearchPanel, PracticeQuestion,
    │   │                      CoverLetterDraft, EmptyState, TableSkeleton,
    │   │                      forms, Navbar, Alert
    │   ├── pages/             MatchPage, CandidatesPage, CheckResumePage
    │   ├── App.jsx            routes
    │   └── main.jsx           React entry point
    ├── index.html
    └── tailwind.config.js
```
