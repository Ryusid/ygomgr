from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload, load_only
from sqlalchemy import exists
from backend.database import get_db
from backend.models import CollectionCard, Card
from backend.schemas import CollectionCardOut, CollectionCardCreate

router = APIRouter(prefix="/api/collection", tags=["collection"])
OWNER_ID = "local"

# Columns to load for Card when joined (excludes heavy raw_json)
_CARD_LIGHT_COLUMNS = [
    Card.id, Card.name, Card.type, Card.description, Card.frame_type,
    Card.race, Card.attribute, Card.archetype,
    Card.atk, Card.def_val, Card.level, Card.linkval,
    Card.scale, Card.image_url,
]

@router.get("", response_model=List[CollectionCardOut])
def get_collection(db: Session = Depends(get_db)):
    items = (
        db.query(CollectionCard)
        .options(
            joinedload(CollectionCard.card).load_only(*_CARD_LIGHT_COLUMNS)
        )
        .filter(CollectionCard.owner_id == OWNER_ID)
        .order_by(CollectionCard.updated_at.desc())
        .all()
    )
    return items

@router.post("", response_model=dict)
def update_collection(payload: CollectionCardCreate, db: Session = Depends(get_db)):
    card_id = payload.card_id
    quantity_owned = payload.quantity_owned

    if card_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid card_id")

    if quantity_owned < 0:
        raise HTTPException(status_code=400, detail="Invalid quantity_owned")

    existing = (
        db.query(CollectionCard)
        .filter(CollectionCard.owner_id == OWNER_ID, CollectionCard.card_id == card_id)
        .first()
    )

    if quantity_owned == 0:
        if existing:
            db.delete(existing)
            db.commit()
        return {"ok": True}

    if existing:
        existing.quantity_owned = quantity_owned
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return {
            "id": existing.id,
            "owner_id": existing.owner_id,
            "card_id": existing.card_id,
            "quantity_owned": existing.quantity_owned,
            "updated_at": existing.updated_at,
        }
    else:
        # Check if card exists using EXISTS (avoids loading full row)
        card_exists = db.query(
            exists().where(Card.id == card_id)
        ).scalar()
        if not card_exists:
            raise HTTPException(status_code=404, detail=f"Card with id {card_id} not found in database")

        new_item = CollectionCard(
            owner_id=OWNER_ID,
            card_id=card_id,
            quantity_owned=quantity_owned,
            updated_at=datetime.now(timezone.utc)
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        return {
            "id": new_item.id,
            "owner_id": new_item.owner_id,
            "card_id": new_item.card_id,
            "quantity_owned": new_item.quantity_owned,
            "updated_at": new_item.updated_at,
        }
