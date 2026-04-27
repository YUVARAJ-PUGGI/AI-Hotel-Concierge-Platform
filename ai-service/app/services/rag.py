from __future__ import annotations
import os
import re
from google import genai


def retrieve_hotel_context(hotel_id: str, message: str, provided_contexts: list[str] | None = None) -> list[str]:
    """
    Pull the most relevant snippets from uploaded hotel docs.
    The backend passes document text in `provided_contexts`.
    """
    normalized = message.lower()
    provided_contexts = provided_contexts or []

    if provided_contexts:
        scored: list[tuple[int, str]] = []
        keywords = [word for word in re.split(r"[^a-z0-9]+", normalized) if len(word) > 2]

        for context in provided_contexts:
            haystack = context.lower()
            score = sum(1 for keyword in keywords if keyword in haystack)
            if score:
                scored.append((score, context))

        scored.sort(key=lambda item: item[0], reverse=True)
        return [context for _, context in scored[:3]]

    return []


def build_guarded_answer(message: str, contexts: list[str]) -> tuple[str, bool, str | None]:
    if not contexts:
        return (
            "I do not have that information right now. I will connect you with the front desk.",
            True,
            "unknown_fact",
        )

    joined = "\n\n".join(contexts[:4])
    
    prompt = f"""You are a helpful hotel concierge.
Use ONLY the following context to answer the user's question.
If the answer is not contained in the context, do not try to make it up. Instead, output EXACTLY the phrase: "ESCALATE_UNKNOWN"
Do not mention policies, timings, amenities, pricing, menu items, or availability unless they are explicitly present in the context.

Context:
{joined}

User Question:
{message}
"""
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return (
            "I do not have that information right now. I will connect you with the front desk.",
            True,
            "configuration_error",
        )
        
    client = genai.Client(api_key=api_key)
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        answer = response.text.strip()
        
        if answer == "ESCALATE_UNKNOWN":
            return (
                "I do not have that information right now. I will connect you with the front desk.",
                True,
                "unknown_fact",
            )
            
        return (answer, False, None)
    except Exception:
        return (
            "I do not have that information right now. I will connect you with the front desk.",
            True,
            "ai_error",
        )
