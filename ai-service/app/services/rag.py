from __future__ import annotations
import os
import re
from google import genai


def _is_menu_query(message: str) -> bool:
    normalized = message.lower()
    return any(
        token in normalized
        for token in [
            "menu",
            "breakfast",
            "lunch",
            "dinner",
            "snacks",
            "food options",
            "what can i order",
            "what to eat",
        ]
    )


def _extract_menu_items(contexts: list[str]) -> list[str]:
    menu_pattern = re.compile(r"^\s*[-*]?\s*([^:]{2,80}):\s*INR\s*([0-9,]+)", re.IGNORECASE)
    seen: set[str] = set()
    items: list[str] = []

    for context in contexts:
        for line in context.splitlines():
            match = menu_pattern.match(line.strip())
            if not match:
                continue
            item = match.group(1).strip()
            price = match.group(2).strip()
            key = re.sub(r"[^a-z0-9]+", " ", item.lower()).strip()
            if not key or key in seen:
                continue
            seen.add(key)
            items.append(f"{item}: INR {price}")

    return items


def retrieve_hotel_context(hotel_id: str, message: str, provided_contexts: list[str] | None = None) -> list[str]:
    """
    Pull the most relevant snippets from uploaded hotel docs.
    The backend passes document text in `provided_contexts`.
    """
    normalized = message.lower()
    menu_query = _is_menu_query(message)
    provided_contexts = provided_contexts or []

    if provided_contexts:
        scored: list[tuple[int, str]] = []
        keywords = [word for word in re.split(r"[^a-z0-9]+", normalized) if len(word) > 2]
        menu_hints = ["menu", "breakfast", "lunch", "dinner", "snacks", "inr", "food"]

        for context in provided_contexts:
            haystack = context.lower()
            score = sum(1 for keyword in keywords if keyword in haystack)
            if menu_query:
                score += sum(2 for hint in menu_hints if hint in haystack)
            if score:
                scored.append((score, context))

        scored.sort(key=lambda item: item[0], reverse=True)
        if scored:
            return [context for _, context in scored[:8]]

        # Fallback for greeting/short prompts where keyword scoring can be zero.
        if menu_query:
            menu_contexts = [
                context for context in provided_contexts if any(hint in context.lower() for hint in menu_hints)
            ]
            if menu_contexts:
                return menu_contexts[:8]
        return provided_contexts[:8]

    return []


def _find_line_value(contexts: list[str], labels: list[str]) -> str | None:
    pattern = re.compile(rf"(?:{'|'.join(re.escape(label) for label in labels)})\s*:\s*(.+)", re.IGNORECASE)
    for context in contexts:
        for line in context.splitlines():
            match = pattern.search(line.strip())
            if match:
                return match.group(1).strip()
    return None


def extract_direct_answer(message: str, contexts: list[str]) -> str | None:
    normalized = message.lower()
    menu_items = _extract_menu_items(contexts)

    check_in = _find_line_value(contexts, ["Check-in Time", "Check in Time", "Check-in"])
    check_out = _find_line_value(contexts, ["Check-out Time", "Check out Time", "Check-out"])
    front_desk = _find_line_value(contexts, ["Front Desk Contact", "Front Desk"])

    if ("check in" in normalized or "check-in" in normalized) and ("time" in normalized or "timing" in normalized):
        if check_in:
            return f"Check-in time is {check_in}."

    if ("check out" in normalized or "check-out" in normalized) and ("time" in normalized or "timing" in normalized):
        if check_out:
            return f"Check-out time is {check_out}."

    if "front desk" in normalized or "contact" in normalized or "phone" in normalized:
        if front_desk:
            return f"You can reach the front desk at {front_desk}."

    if _is_menu_query(message):
        if menu_items:
            preview = "\n".join(menu_items[:12])
            return (
                "Here is the available menu:\n"
                f"{preview}\n\n"
                "Please tell me the exact item name to place your order."
            )

    # Direct price lookup for menu item questions.
    if any(token in normalized for token in ["price", "cost", "how much", "rate"]):
        prices: dict[str, str] = {}
        for item_line in menu_items:
            item, value_part = item_line.split(": INR ", maxsplit=1)
            key = re.sub(r"[^a-z0-9]+", " ", item.lower()).strip()
            prices[key] = value_part.strip()

        for key, value in prices.items():
            if key and key in normalized:
                return f"{key.title()} is priced at INR {value}."

    # More policy/timing extraction without relying on LLM.
    line_map_labels = {
        "early_checkin": ["Early Check-in Policy", "Early Check-in"],
        "late_checkout": ["Late Check-out Policy", "Late Check-out"],
        "in_room_dining": ["In-Room Dining", "In Room Dining"],
        "night_service": ["Night Service", "Night Service (Limited Menu)"],
        "housekeeping": ["Housekeeping"],
        "laundry_pickup": ["Laundry Pickup"],
        "quiet_hours": ["Quiet hours", "Quiet Hours"],
        "outside_food": ["Outside food", "Outside Food"],
        "smoking": ["Smoking"],
        "pets": ["Pets"],
        "accepted_modes": ["Accepted Modes", "Payment Modes"],
    }

    line_values: dict[str, str] = {}
    for key, labels in line_map_labels.items():
        value = _find_line_value(contexts, labels)
        if value:
            line_values[key] = value

    if "early" in normalized and "check" in normalized and line_values.get("early_checkin"):
        return f"Early check-in policy: {line_values['early_checkin']}"
    if "late" in normalized and ("check" in normalized or "checkout" in normalized) and line_values.get("late_checkout"):
        return f"Late check-out policy: {line_values['late_checkout']}"
    if ("dining" in normalized or "room service" in normalized or "food" in normalized) and line_values.get("in_room_dining"):
        return f"In-room dining hours are {line_values['in_room_dining']}."
    if "night" in normalized and "service" in normalized and line_values.get("night_service"):
        return f"Night service hours are {line_values['night_service']}."
    if "housekeeping" in normalized and line_values.get("housekeeping"):
        return f"Housekeeping hours are {line_values['housekeeping']}."
    if "laundry" in normalized and line_values.get("laundry_pickup"):
        return f"Laundry pickup hours are {line_values['laundry_pickup']}."
    if "quiet" in normalized and line_values.get("quiet_hours"):
        return f"Quiet hours are {line_values['quiet_hours']}."
    if "outside food" in normalized and line_values.get("outside_food"):
        return f"Outside food policy: {line_values['outside_food']}"
    if "smoking" in normalized and line_values.get("smoking"):
        return f"Smoking policy: {line_values['smoking']}"
    if "pet" in normalized and line_values.get("pets"):
        return f"Pet policy: {line_values['pets']}"
    if ("payment" in normalized or "pay" in normalized or "upi" in normalized or "card" in normalized) and line_values.get("accepted_modes"):
        return f"Accepted payment modes: {line_values['accepted_modes']}"

    return None


def build_guarded_answer(message: str, contexts: list[str]) -> tuple[str, bool, str | None]:
    if not contexts:
        return (
            "I do not have that information right now. I will connect you with the front desk.",
            True,
            "unknown_fact",
        )

    direct_answer = extract_direct_answer(message, contexts)
    if direct_answer:
        return (direct_answer, False, None)

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
