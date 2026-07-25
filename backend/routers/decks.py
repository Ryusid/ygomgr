import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Deck, DeckCard, Card
from backend.schemas import DeckSchema, DeckCreate, DeckUpdate, DeckDetailOut

router = APIRouter(prefix="/api/decks", tags=["decks"])
OWNER_ID = "local"

@router.get("", response_model=List[DeckSchema])
def get_decks(db: Session = Depends(get_db)):
    decks = (
        db.query(Deck)
        .filter(Deck.owner_id == OWNER_ID)
        .order_by(Deck.created_at.desc())
        .all()
    )
    return decks

@router.post("", response_model=DeckSchema, status_code=status.HTTP_201_CREATED)
def create_deck(payload: DeckCreate, db: Session = Depends(get_db)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Deck name is required")

    deck = Deck(
        id=str(uuid.uuid4()),
        owner_id=OWNER_ID,
        name=name,
        created_at=datetime.now(timezone.utc)
    )
    db.add(deck)
    db.commit()
    db.refresh(deck)
    return deck

@router.get("/{deck_id}", response_model=DeckDetailOut)
def get_deck_detail(deck_id: str, db: Session = Depends(get_db)):
    deck = (
        db.query(Deck)
        .filter(Deck.owner_id == OWNER_ID, Deck.id == deck_id)
        .first()
    )
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    # Load deck cards with card details
    deck_cards = (
        db.query(DeckCard)
        .join(Card, DeckCard.card_id == Card.id)
        .filter(DeckCard.deck_id == deck_id)
        .all()
    )

    return {
        "id": deck.id,
        "name": deck.name,
        "created_at": deck.created_at,
        "deck_cards": deck_cards
    }

@router.patch("/{deck_id}", response_model=DeckSchema)
def rename_deck(deck_id: str, payload: DeckUpdate, db: Session = Depends(get_db)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Deck name is required")

    deck = (
        db.query(Deck)
        .filter(Deck.owner_id == OWNER_ID, Deck.id == deck_id)
        .first()
    )
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    deck.name = name
    db.commit()
    db.refresh(deck)
    return deck

@router.delete("/{deck_id}", response_model=dict)
def delete_deck(deck_id: str, db: Session = Depends(get_db)):
    deck = (
        db.query(Deck)
        .filter(Deck.owner_id == OWNER_ID, Deck.id == deck_id)
        .first()
    )
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    db.delete(deck)
    db.commit()
    return {"ok": True}
