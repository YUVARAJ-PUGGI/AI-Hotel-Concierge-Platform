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
    normalized = message.lower()
    
    # Instant responses for common services to bypass LLM and immediately trigger staff
    instant_services = {
        "wifi": "Our Wi-Fi network is PrestigeInn_Guest and the password is 'prestige123'. Enjoy your browsing!",
        "menu": "We have a variety of items including Breakfast (Idli, Dosa), Lunch/Dinner (Thalis, Biryani), and Snacks. Please type what you'd like to order and our staff will deliver it.",
        "room service": "I have notified the staff. Room service will be right up to assist you.",
        "housekeeping": "I have created a housekeeping ticket. A staff member will be there shortly to clean your room.",
        "laundry": "I have created a laundry ticket. Our staff will come by to pick up your laundry.",
        "towel": "I have notified the staff to bring fresh towels to your room.",
        "cleaning": "I have notified housekeeping to clean your room right away.",
        "doctor": "I have alerted the front desk to arrange for a Doctor on Call.",
        "airport": "I have alerted the front desk regarding your airport transfer request."
    }
    
    for key, response in instant_services.items():
        if key in normalized:
            # Return instant response, escalate=True, reason="service_request" to trigger a ticket
            return (response, True, "service_request")

    if not contexts:
        return (
            "I do not have that information right now. I will connect you with the front desk.",
            True,
            "unknown_fact",
        )

    joined = "\n\n".join(contexts[:4])
    
    prompt = f"""You are a helpful hotel concierge.
Use ONLY the following context to answer the user's question. If the answer is not contained in the context, do not try to make it up. Instead, output EXACTLY the phrase: "ESCALATE_UNKNOWN"

Context:
{joined}

User Question:
{message}
"""
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return ("Sorry, the AI service is missing the API key. Please set GEMINI_API_KEY.", True, "configuration_error")
        
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
    except Exception as e:
        return (
            "I do not have that information right now. I will connect you with the front desk.",
            True,
            "ai_error",
        )
