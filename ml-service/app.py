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


def compute_fit_score(job_description, resume_text):
    """Return how semantically similar two texts are, on a 0-100 scale.

    Embeddings turn each text into a vector of 384 numbers that captures its
    meaning. Cosine similarity measures the angle between those two vectors:
    1.0 means "pointing the same way" (very similar), 0.0 means unrelated.
    We clamp to [0, 1] because cosine similarity can technically be negative,
    and a negative percentage would be meaningless to the user.
    """
    # encode() both texts in one batch; convert_to_tensor keeps them as torch
    # tensors so util.cos_sim can work on them directly.
    embeddings = model.encode([job_description, resume_text], convert_to_tensor=True)

    # cos_sim returns a 1x1 tensor here; .item() pulls out the raw Python float.
    similarity = util.cos_sim(embeddings[0], embeddings[1]).item()

    clamped = max(0.0, min(1.0, similarity))
    return round(clamped * 100, 2)


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

    fit_score = compute_fit_score(job_description, resume_text)

    job_skills = extract_skills(job_description)
    resume_skills = extract_skills(resume_text)

    # Set intersection: skills the job asks for AND the candidate has.
    matched_skills = job_skills & resume_skills
    # Set difference: skills the job asks for but the candidate never mentions.
    missing_skills = job_skills - resume_skills

    return jsonify({
        "fit_score": fit_score,
        # sorted() gives a list (JSON has no sets) in a stable, predictable order.
        "matched_skills": sorted(matched_skills),
        "missing_skills": sorted(missing_skills),
    })


if __name__ == "__main__":
    # host="0.0.0.0" so the service is reachable from other containers/machines,
    # not just from localhost. debug=False keeps the model from being loaded
    # twice by Flask's auto-reloader.
    app.run(host="0.0.0.0", port=5001, debug=False)
