from pydantic import BaseModel
from typing import List


class RecommendPengujiRequest(BaseModel):
    proposalId: str
    topN: int = 3


class PengujiRecommendation(BaseModel):
    dosenId: str
    fullName: str
    nidn: str | None = None
    expertise: str | None = None
    similarityScore: float
    reason: str


class RecommendPengujiResponse(BaseModel):
    proposalId: str
    proposalTitle: str
    recommendations: List[PengujiRecommendation]
    totalDosen: int
    excluded: int


class CheckSimilarityRequest(BaseModel):
    proposalId: str


class SimilarProposal(BaseModel):
    proposalId: str
    title: str
    jurusan: str
    similarityScore: float


class CheckSimilarityResponse(BaseModel):
    proposalId: str
    proposalTitle: str
    highestScore: float
    isFlagged: bool
    threshold: float
    similarProposals: List[SimilarProposal]


class UpdateSimilarityFlagRequest(BaseModel):
    proposalId: str
    similarityScore: float
    similarityFlag: bool


class UpdateSimilarityFlagResponse(BaseModel):
    success: bool


class HealthResponse(BaseModel):
    status: str
    service: str
