from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from backend.database import get_db
from backend.models import Deck, DeckCard
from backend.schemas import DeckUsageOut

router = APIRouter(prefix="/api/deck-usage", tags=["deck_usage"])
OWNER_ID = "local"

@router.get("", response_model=List[DeckUsageOut])
def get_deck_usage(
    excludeDeckId: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = (
        db.query(DeckCard)
        .join(Deck, DeckCard.deck_id == Deck.id)
        .options(joinedload(DeckCard.deck))
        .filter(Deck.owner_id == OWNER_ID)
    )

    if excludeDeckId:
        query = query.filter(DeckCard.deck_id != excludeDeckId)

    deck_rows = query.all()

    usage_map: Dict[int, Dict[str, Any]] = {}

    for row in deck_rows:
        card_id = row.card_id
        quantity = row.quantity
        deck = row.deck

        if not deck:
            continue

        if card_id not in usage_map:
            usage_map[card_id] = {
                "card_id": card_id,
                "quantity_used_elsewhere": 0,
                "decks_dict": {},
            }

        entry = usage_map[card_id]
        entry["quantity_used_elsewhere"] += quantity

        if deck.id in entry["decks_dict"]:
            entry["decks_dict"][deck.id]["quantity"] += quantity
        else:
            entry["decks_dict"][deck.id] = {
                "deck_id": deck.id,
                "deck_name": deck.name,
                "quantity": quantity,
            }

    result = []
    for card_id, entry in usage_map.items():
        result.append({
            "card_id": card_id,
            "quantity_used_elsewhere": entry["quantity_used_elsewhere"],
            "decks": list(entry["decks_dict"].values()),
        })

    return result
