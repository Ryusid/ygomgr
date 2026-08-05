import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import exists
from backend.database import get_db
from backend.models import Deck, DeckCard, Card
from backend.schemas import DeckCardAdd, DeckCardUpdate

router = APIRouter(prefix="/api/decks", tags=["deck_cards"])

@router.post("/{deck_id}/cards", response_model=dict)
def add_card_to_deck(deck_id: str, payload: DeckCardAdd, db: Session = Depends(get_db)):
    card_id = payload.card_id
    quantity = payload.quantity
    section = payload.section

    if not card_id:
        raise HTTPException(status_code=400, detail="Invalid card_id")

    if quantity < 1:
        raise HTTPException(status_code=400, detail="Invalid quantity")

    if section not in ["main", "extra", "side"]:
        raise HTTPException(status_code=400, detail="Invalid section")

    # Use EXISTS for lightweight validation instead of loading full objects
    deck_exists = db.query(
        exists().where(Deck.id == deck_id)
    ).scalar()
    if not deck_exists:
        raise HTTPException(status_code=404, detail="Deck not found")

    card_exists = db.query(
        exists().where(Card.id == card_id)
    ).scalar()
    if not card_exists:
        raise HTTPException(status_code=404, detail="Card not found")

    existing = (
        db.query(DeckCard)
        .filter(
            DeckCard.deck_id == deck_id,
            DeckCard.card_id == card_id,
            DeckCard.section == section,
        )
        .first()
    )

    if existing:
        existing.quantity = quantity
        db.commit()
        db.refresh(existing)
        return {
            "id": existing.id,
            "deck_id": existing.deck_id,
            "card_id": existing.card_id,
            "quantity": existing.quantity,
            "section": existing.section,
        }
    else:
        new_deck_card = DeckCard(
            id=str(uuid.uuid4()),
            deck_id=deck_id,
            card_id=card_id,
            quantity=quantity,
            section=section,
        )
        db.add(new_deck_card)
        db.commit()
        db.refresh(new_deck_card)
        return {
            "id": new_deck_card.id,
            "deck_id": new_deck_card.deck_id,
            "card_id": new_deck_card.card_id,
            "quantity": new_deck_card.quantity,
            "section": new_deck_card.section,
        }

@router.patch("/cards/{deck_card_id}", response_model=dict)
def update_deck_card(deck_card_id: str, payload: DeckCardUpdate, db: Session = Depends(get_db)):
    quantity = payload.quantity
    section = payload.section

    if quantity < 1:
        raise HTTPException(status_code=400, detail="Invalid quantity")

    if section and section not in ["main", "extra", "side"]:
        raise HTTPException(status_code=400, detail="Invalid section")

    deck_card = db.query(DeckCard).filter(DeckCard.id == deck_card_id).first()
    if not deck_card:
        raise HTTPException(status_code=404, detail="Deck card not found")

    deck_card.quantity = quantity
    if section:
        deck_card.section = section

    db.commit()
    db.refresh(deck_card)
    return {
        "id": deck_card.id,
        "deck_id": deck_card.deck_id,
        "card_id": deck_card.card_id,
        "quantity": deck_card.quantity,
        "section": deck_card.section,
    }

@router.delete("/cards/{deck_card_id}", response_model=dict)
def delete_deck_card(deck_card_id: str, db: Session = Depends(get_db)):
    deck_card = db.query(DeckCard).filter(DeckCard.id == deck_card_id).first()
    if not deck_card:
        raise HTTPException(status_code=404, detail="Deck card not found")

    db.delete(deck_card)
    db.commit()
    return {"ok": True}
