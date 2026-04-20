from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    bookingId: str
    hotelId: str
    message: str
    contexts: list[str] = Field(default_factory=list)


class ChatResponse(BaseModel):
    answer: str
    escalate: bool = False
    reason: str | None = None
