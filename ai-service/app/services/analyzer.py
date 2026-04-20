from __future__ import annotations


def detect_room_service(message: str) -> bool:
    msg = message.lower()
    keywords = ["room service", "order food", "extra towels", "housekeeping"]
    return any(word in msg for word in keywords)


def is_hotel_fact_question(message: str) -> bool:
    msg = message.lower()
    hotel_facts = ["check-in", "checkout", "spa", "menu", "wifi", "pool", "policy", "available"]
    return any(word in msg for word in hotel_facts)
