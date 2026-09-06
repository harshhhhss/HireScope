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
| [`client/`](client/)         | React, Vite, Tailwind      | 3000  | Recruiter UI                                      |

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
| `GEMINI_MODEL`   | Gemini model id                              | `gemini-2.0-flash`                   |

### 4. React client (port 3000)

```bash
cd client
npm install
npm run dev
```

Opens <http://localhost:3000>. It talks to the Node API at
`http://localhost:5000` by default; override with `VITE_API_URL` in
`client/.env` if the API runs elsewhere.

Add candidates on the **Candidates** tab first, then paste a posting on the
**Match** tab and hit *Match candidates*. Click *View* on any row to read that
person's three interview questions.

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
│   ├── routes/                index.js, candidateRoutes.js, matchRoutes.js
│   ├── controllers/           matchController.js, candidateController.js
│   ├── services/
│   │   ├── matchService.js    HTTP client for the Python ML service
│   │   └── aiService.js       Gemini client for interview questions
│   └── .env.example
└── client/
    ├── src/
    │   ├── services/api.js    every HTTP call to the Node API
    │   ├── components/        SkillTags, FitScoreBadge, ResultsTable,
    │   │                      CandidateDetailModal, forms, Navbar, Alert
    │   ├── pages/             MatchPage, CandidatesPage
    │   ├── App.jsx            routes
    │   └── main.jsx           React entry point
    ├── index.html
    └── tailwind.config.js
```
