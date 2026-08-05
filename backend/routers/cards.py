from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, load_only
from backend.database import get_db
from backend.models import Card
from backend.schemas import CardSchema

router = APIRouter(prefix="/api/cards", tags=["cards"])

# Columns to load for search results (excludes heavy raw_json and description)
SEARCH_COLUMNS = [
    Card.id, Card.name, Card.type, Card.frame_type,
    Card.race, Card.attribute, Card.archetype,
    Card.atk, Card.def_val, Card.level, Card.linkval,
    Card.scale, Card.image_url,
]

@router.get("/search", response_model=List[CardSchema])
def search_cards(
    q: Optional[str] = None,
    type: Optional[str] = None,
    race: Optional[str] = None,
    attribute: Optional[str] = None,
    archetype: Optional[str] = None,
    minAtk: Optional[int] = Query(None),
    maxAtk: Optional[int] = Query(None),
    minDef: Optional[int] = Query(None),
    maxDef: Optional[int] = Query(None),
    minLevel: Optional[int] = Query(None),
    maxLevel: Optional[int] = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    # Check if any filter is set
    has_filter = any([
        q and q.strip(),
        type and type.strip() and type != "all",
        race and race.strip() and race != "all",
        attribute and attribute.strip() and attribute != "all",
        archetype and archetype.strip() and archetype != "all",
        minAtk is not None,
        maxAtk is not None,
        minDef is not None,
        maxDef is not None,
        minLevel is not None,
        maxLevel is not None,
    ])

    if not has_filter:
        return []

    query = db.query(Card).options(load_only(*SEARCH_COLUMNS))

    if q and len(q.strip()) >= 2:
        query = query.filter(Card.name.ilike(f"%{q.strip()}%"))

    if type and type != "all":
        query = query.filter(Card.type == type)

    if race and race != "all":
        query = query.filter(Card.race == race)

    if attribute and attribute != "all":
        query = query.filter(Card.attribute == attribute)

    if archetype and archetype != "all":
        query = query.filter(Card.archetype.ilike(f"%{archetype.strip()}%"))

    if minAtk is not None:
        query = query.filter(Card.atk >= minAtk)

    if maxAtk is not None:
        query = query.filter(Card.atk <= maxAtk)

    if minDef is not None:
        query = query.filter(Card.def_val >= minDef)

    if maxDef is not None:
        query = query.filter(Card.def_val <= maxDef)

    if minLevel is not None:
        query = query.filter(Card.level >= minLevel)

    if maxLevel is not None:
        query = query.filter(Card.level <= maxLevel)

    cards = query.order_by(Card.name.asc()).offset(offset).limit(limit).all()
    return cards
