from fastapi import APIRouter

from app.models.schemas import ChatRequest, ChatResponse
from app.services.rag import retrieve_hotel_context, build_guarded_answer

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    contexts = retrieve_hotel_context(payload.hotelId, payload.message, payload.contexts)
    answer, escalate, reason = build_guarded_answer(payload.message, contexts)
    return ChatResponse(answer=answer, escalate=escalate, reason=reason)
