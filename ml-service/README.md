# HireScope ML Service

A small Python microservice that scores how well a resume matches a job
description. The Node backend calls it over HTTP; it has no database and holds
no state of its own.

## What it does

For one job description and one resume it returns two independent signals:

| Field            | How it is produced                                                                 |
| ---------------- | ---------------------------------------------------------------------------------- |
| `fit_score`      | Both texts are embedded with the `all-MiniLM-L6-v2` sentence-transformer model, then compared with **cosine similarity**, scaled to 0–100. This is a *semantic* score: it rewards a resume that talks about the same kind of work, even with different wording. |
| `matched_skills` | Skills that appear in **both** the job description and the resume (set intersection). |
| `missing_skills` | Skills the job description asks for that the resume never mentions (set difference). |

Skills come from a hand-written taxonomy of ~60 common tech skills in
[`skills.py`](skills.py) — languages, frontend, backend, databases, cloud/DevOps,
data/ML and tooling. Each skill has a canonical name plus aliases, so `js`,
`javascript` and `JavaScript` all collapse to the single skill `JavaScript`.

## How to run it

```bash
cd ml-service

# 1. (Recommended) create an isolated virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies (torch is large — expect a few minutes)
pip install -r requirements.txt

# 3. Start the service
python app.py
```

> **Python version:** use **3.10-3.12**. `torch` publishes wheels for brand-new
> Python releases on a delay, so on Python 3.13/3.14 `pip install` may fail with
> "no matching distribution found for torch". On this machine the default
> `python` is 3.14, so create the venv with 3.12 explicitly:
>
> ```bash
> py -3.12 -m venv venv     # Windows
> python3.12 -m venv venv   # macOS / Linux
> ```

The service runs on **port 5001** → `http://localhost:5001`.

The **first** start downloads the `all-MiniLM-L6-v2` weights (~90 MB) from
Hugging Face and caches them in `~/.cache/huggingface`, so it takes longer than
later starts. The model is loaded once at startup, not per request, so each
`/match` call is only a few milliseconds of work.

## The API

### `POST /match`

Request body:

```json
{
  "job_description": "Senior Backend Engineer. Strong Python and Node.js, MongoDB, Docker, Kubernetes, AWS.",
  "resume_text": "Built REST APIs in Python (Flask) and Node.js/Express. Used MongoDB. Deployed with Docker on AWS."
}
```

Response `200 OK`:

```json
{
  "fit_score": 72.14,
  "matched_skills": ["AWS", "Docker", "MongoDB", "Node.js", "Python"],
  "missing_skills": ["Kubernetes"]
}
```

Response `400 Bad Request` if either field is missing or is not a non-empty string:

```json
{ "error": "'resume_text' is required and must be a non-empty string" }
```

### Try it with curl

```bash
curl -X POST http://localhost:5001/match \
  -H "Content-Type: application/json" \
  -d '{"job_description":"We need Python, Docker and Kubernetes.","resume_text":"I use Python and Docker daily."}'
```

## Files

| File               | Purpose                                                        |
| ------------------ | -------------------------------------------------------------- |
| `app.py`           | Flask app, the `/match` endpoint, scoring and skill extraction. |
| `skills.py`        | The skills taxonomy (canonical name → aliases).                 |
| `requirements.txt` | `flask`, `sentence-transformers`, `torch`.                      |
