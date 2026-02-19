from pydantic import BaseModel

class ReviewInput(BaseModel):
    text: str
    rating: int | float | None = None
    verified_purchase: bool | None = None
    review_time: str | None = None
    helpful_vote: int | None = None
    user_review_burst: int | None = None
    domain: str | None = None

class PredictionOutput(BaseModel):
    prediction: str
    confidence: float
    text_risk: float
    behavior_score: float
