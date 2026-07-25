from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base
from backend.routers import (
    cards,
    collection,
    decks,
    deck_cards,
    needed_cards,
    deck_usage,
)

# Create database tables automatically if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Yu-Gi-Oh Manager API",
    description="FastAPI Backend for YGO Cards, Collections, Decks, and Wishlists",
    version="1.0.0",
)

# Enable CORS for Next.js frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev / home cluster
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(cards.router)
app.include_router(collection.router)
app.include_router(decks.router)
app.include_router(deck_cards.router)
app.include_router(needed_cards.router)
app.include_router(deck_usage.router)

@app.get("/healthz", tags=["health"])
def health_check():
    return {"status": "ok", "service": "ygo-manager-backend"}

@app.get("/", tags=["health"])
def root():
    return {"message": "Yu-Gi-Oh Manager FastAPI Service is running."}
