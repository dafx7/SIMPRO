"""
Detects similarity between a new proposal and all existing proposals.

Algorithm:
1. Get all existing proposals from DB (excluding current proposal)
2. Build TF-IDF matrix on title + abstract of all existing proposals
3. Transform new proposal text using same vectorizer
4. Compute cosine similarity between new proposal and all existing
5. Return results sorted by score descending
6. Flag if any score exceeds SIMILARITY_THRESHOLD (default 0.70)
"""

import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv

from database import get_all_proposals, get_proposal_by_id

load_dotenv()

SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.70"))


class ProposalNotFoundError(Exception):
    pass


def check_similarity(proposal_id: str) -> dict:
    proposal = get_proposal_by_id(proposal_id)
    if not proposal:
        raise ProposalNotFoundError(f"Proposal {proposal_id} not found")

    all_proposals = get_all_proposals()
    other_proposals = [p for p in all_proposals if p["id"] != proposal_id]

    if not other_proposals:
        return {
            "proposalId": proposal_id,
            "proposalTitle": proposal["title"],
            "highestScore": 0.0,
            "isFlagged": False,
            "threshold": SIMILARITY_THRESHOLD,
            "similarProposals": [],
        }

    proposal_text = f"{proposal['title']} {proposal['abstract']}"
    other_texts = [f"{p['title']} {p['abstract']}" for p in other_proposals]

    corpus = other_texts + [proposal_text]

    vectorizer = TfidfVectorizer(stop_words=None)
    tfidf_matrix = vectorizer.fit_transform(corpus)

    query_vector = tfidf_matrix[-1]
    other_vectors = tfidf_matrix[:-1]

    scores = cosine_similarity(query_vector, other_vectors).flatten()

    scored = list(zip(other_proposals, scores))
    scored.sort(key=lambda x: x[1], reverse=True)

    highest_score = float(scores.max()) if len(scores) > 0 else 0.0

    similar_proposals = [
        {
            "proposalId": p["id"],
            "title": p["title"],
            "jurusan": p["jurusan"],
            "similarityScore": round(float(score), 4),
        }
        for p, score in scored[:5]
    ]

    return {
        "proposalId": proposal_id,
        "proposalTitle": proposal["title"],
        "highestScore": round(highest_score, 4),
        "isFlagged": highest_score > SIMILARITY_THRESHOLD,
        "threshold": SIMILARITY_THRESHOLD,
        "similarProposals": similar_proposals,
    }
