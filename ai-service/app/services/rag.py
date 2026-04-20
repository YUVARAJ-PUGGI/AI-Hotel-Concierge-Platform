from __future__ import annotations

import re


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

    canned = {
        "check-in": "Standard check-in time is 2:00 PM.",
        "checkout": "Standard checkout time is 11:00 AM.",
        "wifi": "Wi-Fi password is shared at check-in desk and in-room card.",
        "room service": "Room service is available from 6:00 AM to 11:00 PM."
    }

    hits: list[str] = []
    for key, value in canned.items():
        if key in normalized:
            hits.append(value)
    return hits


def build_guarded_answer(message: str, contexts: list[str]) -> tuple[str, bool, str | None]:
    if not contexts:
        return (
            "I do not have that information right now. I will connect you with the front desk.",
            True,
            "unknown_fact",
        )

    joined = " ".join(contexts[:3])
    return (f"Based on the hotel documents, {joined}", False, None)
