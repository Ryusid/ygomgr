from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field

class CardSchema(BaseModel):
    id: int
    name: str
    type: Optional[str] = None
    description: Optional[str] = None
    frame_type: Optional[str] = None
    race: Optional[str] = None
    attribute: Optional[str] = None
    archetype: Optional[str] = None
    atk: Optional[int] = None
    def_val: Optional[int] = Field(None, alias="def")
    level: Optional[int] = None
    linkval: Optional[int] = None
    scale: Optional[int] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True

class CollectionCardCreate(BaseModel):
    card_id: int
    quantity_owned: int

class CollectionCardOut(BaseModel):
    card_id: int
    quantity_owned: int
    updated_at: Optional[datetime] = None
    cards: Optional[CardSchema] = Field(None, alias="card")

    class Config:
        from_attributes = True
        populate_by_name = True

class DeckCreate(BaseModel):
    name: str

class DeckUpdate(BaseModel):
    name: str

class DeckSchema(BaseModel):
    id: str
    owner_id: str
    name: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DeckCardOut(BaseModel):
    id: str
    quantity: int
    section: str
    cards: Optional[CardSchema] = Field(None, alias="card")

    class Config:
        from_attributes = True
        populate_by_name = True

class DeckDetailOut(BaseModel):
    id: str
    name: str
    created_at: Optional[datetime] = None
    deck_cards: List[DeckCardOut] = []

    class Config:
        from_attributes = True

class DeckCardAdd(BaseModel):
    card_id: int
    quantity: int = 1
    section: str = "main"

class DeckCardUpdate(BaseModel):
    quantity: int
    section: Optional[str] = None

class DeckUsageDeckInfo(BaseModel):
    deck_id: str
    deck_name: str
    quantity: int

class DeckUsageOut(BaseModel):
    card_id: int
    quantity_used_elsewhere: int
    decks: List[DeckUsageDeckInfo] = []

class NeededCardDeckInfo(BaseModel):
    deck_id: str
    deck_name: str
    quantity: int

class NeededCardOut(BaseModel):
    card_id: int
    missing_quantity: int
    total_needed: int
    quantity_owned: int
    card: CardSchema
    decks: List[NeededCardDeckInfo] = []
