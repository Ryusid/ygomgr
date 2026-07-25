import uuid
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base

class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True, autoincrement=False) # YGOPRODeck card ID
    name = Column(String(255), nullable=False, index=True)
    type = Column(String(100), nullable=True, index=True)
    description = Column(Text, nullable=True)
    frame_type = Column(String(50), nullable=True)
    race = Column(String(100), nullable=True, index=True)
    attribute = Column(String(50), nullable=True, index=True)
    archetype = Column(String(100), nullable=True, index=True)
    atk = Column(Integer, nullable=True, index=True)
    def_val = Column("def", Integer, nullable=True, index=True)
    level = Column(Integer, nullable=True, index=True)
    linkval = Column(Integer, nullable=True)
    scale = Column(Integer, nullable=True)
    image_url = Column(Text, nullable=True)
    raw_json = Column(JSON, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class CollectionCard(Base):
    __tablename__ = "collection_cards"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    owner_id = Column(String(100), default="local", index=True, nullable=False)
    card_id = Column(Integer, ForeignKey("cards.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity_owned = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    card = relationship("Card")

    __table_args__ = (
        UniqueConstraint("owner_id", "card_id", name="uq_owner_card"),
    )

class Deck(Base):
    __tablename__ = "decks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String(100), default="local", index=True, nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    deck_cards = relationship("DeckCard", back_populates="deck", cascade="all, delete-orphan")

class DeckCard(Base):
    __tablename__ = "deck_cards"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    deck_id = Column(String(36), ForeignKey("decks.id", ondelete="CASCADE"), nullable=False, index=True)
    card_id = Column(Integer, ForeignKey("cards.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, default=1, nullable=False)
    section = Column(String(20), default="main", nullable=False) # 'main', 'extra', 'side'

    deck = relationship("Deck", back_populates="deck_cards")
    card = relationship("Card")

    __table_args__ = (
        UniqueConstraint("deck_id", "card_id", "section", name="uq_deck_card_section"),
    )
