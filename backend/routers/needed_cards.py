from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload, load_only
from backend.database import get_db
from backend.models import Deck, DeckCard, CollectionCard, Card
from backend.schemas import NeededCardOut

router = APIRouter(prefix="/api/needed-cards", tags=["needed_cards"])
OWNER_ID = "local"

# Columns to load for Card when joined (excludes heavy raw_json)
_CARD_LIGHT_COLUMNS = [
    Card.id, Card.name, Card.type, Card.description, Card.frame_type,
    Card.race, Card.attribute, Card.archetype,
    Card.atk, Card.def_val, Card.level, Card.linkval,
    Card.scale, Card.image_url,
]

@router.get("", response_model=List[NeededCardOut])
def get_needed_cards(db: Session = Depends(get_db)):
    # 1. Fetch deck cards for owner — eager load card and deck in one query
    deck_rows = (
        db.query(DeckCard)
        .join(Deck, DeckCard.deck_id == Deck.id)
        .options(
            joinedload(DeckCard.card).load_only(*_CARD_LIGHT_COLUMNS),
            joinedload(DeckCard.deck),
        )
        .filter(Deck.owner_id == OWNER_ID)
        .all()
    )

    # 2. Fetch collection owned quantities for owner
    collection_rows = (
        db.query(CollectionCard)
        .filter(CollectionCard.owner_id == OWNER_ID)
        .all()
    )

    owned_by_card = {col.card_id: col.quantity_owned for col in collection_rows}

    # 3. Aggregate needed counts
    needed_map: Dict[int, Dict[str, Any]] = {}

    for row in deck_rows:
        card_id = row.card_id
        quantity = row.quantity
        deck = row.deck
        card = row.card

        if not deck or not card:
            continue

        if card_id not in needed_map:
            needed_map[card_id] = {
                "card_id": card_id,
                "total_needed": 0,
                "quantity_owned": owned_by_card.get(card_id, 0),
                "card": card,
                "decks_dict": {},
            }

        entry = needed_map[card_id]
        entry["total_needed"] += quantity

        if deck.id in entry["decks_dict"]:
            entry["decks_dict"][deck.id]["quantity"] += quantity
        else:
            entry["decks_dict"][deck.id] = {
                "deck_id": deck.id,
                "deck_name": deck.name,
                "quantity": quantity,
            }

    # 4. Calculate missing quantities & format response
    needed_list = []
    for card_id, entry in needed_map.items():
        total_needed = entry["total_needed"]
        quantity_owned = entry["quantity_owned"]
        missing_quantity = max(0, total_needed - quantity_owned)

        if missing_quantity > 0:
            decks_list = list(entry["decks_dict"].values())
            needed_list.append({
                "card_id": card_id,
                "missing_quantity": missing_quantity,
                "total_needed": total_needed,
                "quantity_owned": quantity_owned,
                "card": entry["card"],
                "decks": decks_list,
            })

    # 5. Sort by missing_quantity desc, then card name asc
    needed_list.sort(key=lambda x: (-x["missing_quantity"], x["card"].name))

    return needed_list
