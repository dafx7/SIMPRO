"""
Recommends Dosen as Penguji based on TF-IDF cosine similarity
between proposal (title + abstract) and dosen expertise descriptions.

Algorithm:
1. Build corpus: one document per dosen = their expertise text
2. Add query document = proposal title + " " + abstract
3. Fit TF-IDF on entire corpus
4. Compute cosine similarity between query and each dosen document
5. Sort by score descending
6. Exclude: dosen who is already Pembimbing for this proposal
7. Exclude: dosen already assigned as Penguji for this proposal
8. Return top N results (default N=3)
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from database import get_all_dosen, get_proposal_by_id, get_assigned_penguji


class ProposalNotFoundError(Exception):
    pass


def recommend_penguji(proposal_id: str, top_n: int = 3) -> dict:
    proposal = get_proposal_by_id(proposal_id)
    if not proposal:
        raise ProposalNotFoundError(f"Proposal {proposal_id} not found")

    all_dosen = get_all_dosen()
    assigned_penguji_ids = set(get_assigned_penguji(proposal_id))
    pembimbing_id = proposal.get("pembimbingId")

    excluded_count = 0
    eligible_dosen = []
    for dosen in all_dosen:
        if dosen["id"] == pembimbing_id or dosen["id"] in assigned_penguji_ids:
            excluded_count += 1
            continue
        eligible_dosen.append(dosen)

    proposal_text = f"{proposal['title']} {proposal['abstract']}"

    if not eligible_dosen:
        return {
            "proposalId": proposal_id,
            "proposalTitle": proposal["title"],
            "recommendations": [],
            "totalDosen": len(all_dosen),
            "excluded": excluded_count,
        }

    dosen_texts = [
        (dosen.get("expertise") or dosen["fullName"] or "").strip() or dosen["fullName"]
        for dosen in eligible_dosen
    ]

    corpus = dosen_texts + [proposal_text]

    vectorizer = TfidfVectorizer(stop_words=None)
    tfidf_matrix = vectorizer.fit_transform(corpus)

    query_vector = tfidf_matrix[-1]
    dosen_vectors = tfidf_matrix[:-1]

    scores = cosine_similarity(query_vector, dosen_vectors).flatten()

    scored_dosen = list(zip(eligible_dosen, scores))
    scored_dosen.sort(key=lambda x: x[1], reverse=True)

    recommendations = []
    for dosen, score in scored_dosen[:top_n]:
        expertise_text = dosen.get("expertise") or dosen["fullName"]
        recommendations.append(
            {
                "dosenId": dosen["id"],
                "fullName": dosen["fullName"],
                "nidn": dosen.get("nidn"),
                "expertise": dosen.get("expertise"),
                "similarityScore": round(float(score), 4),
                "reason": f"Keahlian relevan: {expertise_text}",
            }
        )

    return {
        "proposalId": proposal_id,
        "proposalTitle": proposal["title"],
        "recommendations": recommendations,
        "totalDosen": len(all_dosen),
        "excluded": excluded_count,
    }
