"""
HireScope ML microservice.

One job: given a job description and a resume, say how well they match.

It does that in two independent ways and returns both:
  1. A semantic "fit score" from sentence embeddings + cosine similarity.
  2. A literal skills diff, using a small hand-written skills taxonomy.

Run with:  python app.py   (listens on http://localhost:5001)
"""

import re

from flask import Flask, jsonify, request
from sentence_transformers import SentenceTransformer, util

from role_profiles import BASELINE_RESUMES, ROLE_PROFILES
from skills import SKILL_TAXONOMY

# The name of the pretrained model we download from Hugging Face. all-MiniLM-L6-v2
# is small (~90MB) and fast, and maps any sentence to a 384-dimensional vector.
MODEL_NAME = "all-MiniLM-L6-v2"

# Load the model ONCE, at import time, instead of once per request. Loading takes
# a few seconds; encoding a piece of text afterwards takes milliseconds. The first
# run also downloads the weights and caches them in ~/.cache/huggingface.
print(f"Loading sentence-transformers model '{MODEL_NAME}' (first run downloads it)...")
model = SentenceTransformer(MODEL_NAME)
print("Model loaded. ML service ready.")

app = Flask(__name__)


# ---------------------------------------------------------------------------
# Role profile embeddings
#
# The profile texts never change between requests, so they are embedded once at
# startup and kept in memory. Scoring a resume against all fifteen is then one
# encode() for the resume plus a single matrix multiply - not fifteen model
# calls. Adding a role to role_profiles.py costs one more row in this matrix and
# nothing else.
# ---------------------------------------------------------------------------
print(f"Embedding {len(ROLE_PROFILES)} role profiles...")
ROLE_PROFILE_EMBEDDINGS = model.encode(
    [profile["description"] for profile in ROLE_PROFILES],
    convert_to_tensor=True,
)
print("Role profiles embedded and cached.")


# ---------------------------------------------------------------------------
# Profile baselines
#
# Raw cosine similarity is not comparable across profiles. A broadly written
# profile - one that mentions SQL, cloud, Agile and three languages - lands
# near almost any resume in embedding space, so it starts every comparison from
# a high floor. A narrow one like Telecom / Signal Processing starts near zero.
# Ranking on raw cosine therefore hands the broad profiles places they did not
# earn, which is exactly the "generic text wins by default" failure.
#
# The fix is to measure that floor rather than argue about it. Each profile is
# scored against the same fixed set of varied resumes, and the MEDIAN of those
# scores is its baseline: what this profile scores against an arbitrary resume.
#
# Median, not mean, and the difference is not cosmetic. The calibration set
# contains one resume per discipline, so a well-written specific profile has
# exactly one strong match in it - embedded-systems scores 0.74 against the
# embedded resume and ~0.2 against everything else. Averaging pulls that peak
# into the baseline and the profile is then penalised for being good at its own
# job: design-engineer-cad's mean sits 0.106 above its median for this reason,
# sde-backend's 0.073. Business Analyst, which scores 0.26-0.34 against all six
# regardless of what they say, has no peak to remove and a mean-median gap of
# 0.004. So the mean quietly handicaps the specific profiles and leaves the
# generic one alone - the opposite of what this whole mechanism is for. The
# median ignores the single on-topic outlier and measures the floor.
#
# Scoring then reports headroom above that baseline, normalised by how far the
# profile could have travelled:
#
#     (similarity - baseline) / (1 - baseline)
#
# A resume that scores exactly what this profile scores against anybody gets 0.
# A perfect match still gets 100, whatever the baseline was. Dividing by the
# remaining range matters: without it a profile with a high baseline would keep
# an advantage, because the same absolute gain is a smaller achievement when
# you started closer to the top.
#
# This costs one extra encode of six short texts at startup and nothing at all
# per request - the baselines are a fixed vector from here on.
# ---------------------------------------------------------------------------
print(f"Calibrating baselines against {len(BASELINE_RESUMES)} sample resumes...")
_baseline_embeddings = model.encode(BASELINE_RESUMES, convert_to_tensor=True)

# One row per sample resume, one column per profile; the column median is the
# profile's baseline.
# .median() on an even-length dimension returns the lower of the two middle
# values rather than their average. That is fine here - the point is to ignore
# the on-topic outlier, and either middle value does that.
PROFILE_BASELINES = util.cos_sim(_baseline_embeddings, ROLE_PROFILE_EMBEDDINGS).median(dim=0).values

for _index, _profile in enumerate(ROLE_PROFILES):
    print(f"  {_profile['id']:<32} baseline {float(PROFILE_BASELINES[_index]):.4f}")
print("Baselines cached.")


# Sentence-pair matching is O(n*m) comparisons, so both sides are capped. A
# resume runs to maybe 40 lines and a posting to 60; beyond that the extra
# sentences are boilerplate about benefits and equal opportunity.
MAX_SENTENCES = 60

# Shorter fragments are section headers ("Skills", "Education") or list stubs.
# They embed poorly and make for meaningless "matches".
MIN_SENTENCE_CHARS = 30

# Below this, a pair is not evidence of anything - the two sentences simply
# both happen to be English. Established by eye: unrelated pairs sit around
# 0.1-0.3, genuinely related ones clear 0.45 comfortably.
MIN_PAIR_SIMILARITY = 0.35


def split_into_sentences(text):
    """Split text into sentence-like chunks.

    Resumes are not prose: they are bullets and newline-separated fragments,
    many without a full stop. So this splits on line breaks and bullet markers
    as well as sentence punctuation, then drops anything too short to carry
    meaning on its own.
    """
    # Normalise bullets to line breaks first, then split on newlines or on a
    # full stop / question mark / exclamation followed by whitespace.
    normalised = re.sub(r"[•●▪\-\*]\s+", "\n", text)
    pieces = re.split(r"(?<=[.!?])\s+|\n+", normalised)

    cleaned = []
    for piece in pieces:
        stripped = re.sub(r"\s+", " ", piece).strip(" .;:-")
        if len(stripped) >= MIN_SENTENCE_CHARS:
            cleaned.append(stripped)

    return cleaned[:MAX_SENTENCES]


def top_sentence_matches(job_description, resume_text, limit=3):
    """Find the resume lines that best explain the score.

    Embeds every sentence on both sides, builds the full similarity matrix, and
    returns the strongest pairs. This is what makes the score checkable: rather
    than "68", the user sees which line of their resume the model thinks
    answers which line of the posting, and can judge that for themselves.

    Each resume sentence appears at most once, otherwise one strong line tends
    to claim every slot and the list says less than a single pair would.
    """
    job_sentences = split_into_sentences(job_description)
    resume_sentences = split_into_sentences(resume_text)

    if not job_sentences or not resume_sentences:
        return []

    job_embeddings = model.encode(job_sentences, convert_to_tensor=True)
    resume_embeddings = model.encode(resume_sentences, convert_to_tensor=True)

    # A matrix of every resume sentence against every job sentence.
    scores = util.cos_sim(resume_embeddings, job_embeddings)

    pairs = []
    for resume_index in range(len(resume_sentences)):
        row = scores[resume_index]
        best_job_index = int(row.argmax())
        pairs.append(
            {
                "resume": resume_sentences[resume_index],
                "job": job_sentences[best_job_index],
                "similarity": round(float(row[best_job_index]), 4),
            }
        )

    pairs.sort(key=lambda pair: pair["similarity"], reverse=True)

    return [pair for pair in pairs if pair["similarity"] >= MIN_PAIR_SIMILARITY][:limit]


def compute_fit_score(job_description, resume_text):
    """Return the raw similarity and its 0-100 presentation.

    Embeddings turn each text into a vector of 384 numbers that captures its
    meaning. Cosine similarity measures the angle between those two vectors:
    1.0 means "pointing the same way" (very similar), 0.0 means unrelated.
    We clamp to [0, 1] because cosine similarity can technically be negative,
    and a negative percentage would be meaningless to the user.

    Both numbers are returned because they are the same measurement: the score
    is just the similarity times 100. Showing them together is the point - it
    makes clear the 0-100 figure is a rescaling, not a separate judgement.
    """
    # encode() both texts in one batch; convert_to_tensor keeps them as torch
    # tensors so util.cos_sim can work on them directly.
    embeddings = model.encode([job_description, resume_text], convert_to_tensor=True)

    # cos_sim returns a 1x1 tensor here; .item() pulls out the raw Python float.
    similarity = util.cos_sim(embeddings[0], embeddings[1]).item()

    clamped = max(0.0, min(1.0, similarity))
    return round(clamped * 100, 2), round(similarity, 4)


def extract_skills(text):
    """Return the set of canonical skill names mentioned in `text`.

    We lowercase the text once, then look for each alias with a regex. The
    lookarounds are a hand-rolled word boundary: we only accept a match if the
    character before is not a letter, digit, '+', '#' or '.', and the
    character after is not a letter, digit, '+' or '#'. The leading dot is excluded so that the "js" in
    "node.js" is not counted as the separate skill "JavaScript", while "react"
    in "react.js" still matches.
    Plain \b does not work here because '+' and '#' are not word characters, so
    \bc++\b would never match "c++".
    """
    lowered = text.lower()
    found = set()

    for canonical_name, aliases in SKILL_TAXONOMY.items():
        for alias in aliases:
            # re.escape turns "c++" into "c\+\+" so the regex engine reads the
            # plus signs as literal characters rather than "one or more".
            pattern = r"(?<![a-z0-9+#.])" + re.escape(alias.lower()) + r"(?![a-z0-9+#])"
            if re.search(pattern, lowered):
                found.add(canonical_name)
                break  # one alias is enough; move on to the next skill

    return found


@app.route("/match", methods=["POST"])
def match():
    """POST /match  ->  { fit_score, matched_skills, missing_skills }"""
    # silent=True makes Flask return None for a bad/missing body instead of
    # raising, so we can send our own clean 400 error.
    body = request.get_json(silent=True) or {}

    job_description = body.get("job_description")
    resume_text = body.get("resume_text")

    # Validate before touching the model: both fields must be present strings.
    if not isinstance(job_description, str) or not job_description.strip():
        return jsonify({"error": "'job_description' is required and must be a non-empty string"}), 400
    if not isinstance(resume_text, str) or not resume_text.strip():
        return jsonify({"error": "'resume_text' is required and must be a non-empty string"}), 400

    fit_score, similarity = compute_fit_score(job_description, resume_text)

    job_skills = extract_skills(job_description)
    resume_skills = extract_skills(resume_text)

    # Set intersection: skills the job asks for AND the candidate has.
    matched_skills = job_skills & resume_skills
    # Set difference: skills the job asks for but the candidate never mentions.
    missing_skills = job_skills - resume_skills

    return jsonify({
        "fit_score": fit_score,
        # The raw cosine value behind the score, so the client can show the
        # arithmetic rather than just the result.
        "similarity": similarity,
        # The sentence pairs that best explain where the score came from.
        "top_matches": top_sentence_matches(job_description, resume_text),
        # sorted() gives a list (JSON has no sets) in a stable, predictable order.
        "matched_skills": sorted(matched_skills),
        "missing_skills": sorted(missing_skills),
    })


@app.route("/role-fit", methods=["POST"])
def role_fit():
    """POST /role-fit  ->  { roles: [{ id, title, branch, fit_score, similarity, baseline }] }

    Scores one resume against every cached role profile. The resume is embedded
    once; the comparison against all profiles is then vector arithmetic against
    the matrix built at startup, which is why adding roles stays cheap.

    fit_score is not the raw cosine. It is the resume's similarity measured
    against this profile's own baseline, because raw cosine values are not
    comparable between a narrowly written profile and a broad one.
    """
    body = request.get_json(silent=True) or {}
    resume_text = body.get("resume_text")

    if not isinstance(resume_text, str) or not resume_text.strip():
        return jsonify({"error": "'resume_text' is required and must be a non-empty string"}), 400

    resume_embedding = model.encode(resume_text, convert_to_tensor=True)

    # One row of similarities: this resume against every profile.
    scores = util.cos_sim(resume_embedding, ROLE_PROFILE_EMBEDDINGS)[0]

    roles = []
    for index, profile in enumerate(ROLE_PROFILES):
        similarity = float(scores[index])
        baseline = float(PROFILE_BASELINES[index])

        # How far above this profile's own floor the resume got, as a fraction
        # of the distance it could have gone. See the note beside
        # PROFILE_BASELINES for why the raw cosine is not used directly.
        relative = (similarity - baseline) / max(1e-6, 1.0 - baseline)
        clamped = max(0.0, min(1.0, relative))

        roles.append({
            "id": profile["id"],
            "title": profile["title"],
            "branch": profile["branch"],
            "fit_score": round(clamped * 100, 2),
            # The raw cosine and the floor it was measured against, so the
            # adjustment is inspectable rather than a hidden fudge factor.
            "similarity": round(similarity, 4),
            "baseline": round(baseline, 4),
        })

    roles.sort(key=lambda role: role["fit_score"], reverse=True)

    return jsonify({"roles": roles, "profile_count": len(ROLE_PROFILES)})


if __name__ == "__main__":
    # host="0.0.0.0" so the service is reachable from other containers/machines,
    # not just from localhost. debug=False keeps the model from being loaded
    # twice by Flask's auto-reloader.
    app.run(host="0.0.0.0", port=5001, debug=False)
