import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from models import (
    RecommendPengujiRequest,
    RecommendPengujiResponse,
    CheckSimilarityRequest,
    CheckSimilarityResponse,
    UpdateSimilarityFlagRequest,
    UpdateSimilarityFlagResponse,
    HealthResponse,
)
from recommender import recommend_penguji, ProposalNotFoundError as RecommenderNotFoundError
from similarity import check_similarity, ProposalNotFoundError as SimilarityNotFoundError
from database import update_similarity_flag

load_dotenv()

app = FastAPI(title="SIMPRO AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health():
    return {"status": "ok", "service": "SIMPRO AI Service"}


@app.post("/recommend-penguji", response_model=RecommendPengujiResponse)
def recommend_penguji_endpoint(req: RecommendPengujiRequest):
    try:
        result = recommend_penguji(req.proposalId, req.topN)
        return result
    except RecommenderNotFoundError:
        raise HTTPException(status_code=404, detail="Proposal tidak ditemukan")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/check-similarity", response_model=CheckSimilarityResponse)
def check_similarity_endpoint(req: CheckSimilarityRequest):
    try:
        result = check_similarity(req.proposalId)
        return result
    except SimilarityNotFoundError:
        raise HTTPException(status_code=404, detail="Proposal tidak ditemukan")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/update-similarity-flag", response_model=UpdateSimilarityFlagResponse)
def update_similarity_flag_endpoint(req: UpdateSimilarityFlagRequest):
    try:
        update_similarity_flag(req.proposalId, req.similarityScore, req.similarityFlag)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    port = int(os.getenv("AI_SERVICE_PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
