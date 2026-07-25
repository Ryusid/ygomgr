import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from backend.database import engine, Base
from backend.routers import (
    cards,
    collection,
    decks,
    deck_cards,
    needed_cards,
    deck_usage,
)

logger = logging.getLogger(__name__)

db_initialized = False


def try_init_db(max_attempts: int = 20, delay_seconds: int = 3) -> bool:
    """
    Try to create DB tables, but do not kill the app if MariaDB is temporarily unavailable.
    Kubernetes readiness will tell us whether the DB is usable.
    """
    for attempt in range(1, max_attempts + 1):
        try:
            logger.info("Initializing database tables, attempt %s/%s", attempt, max_attempts)
            Base.metadata.create_all(bind=engine)
            logger.info("Database initialization successful")
            return True
        except Exception as exc:
            logger.warning("Database initialization failed: %s", exc)

            if attempt < max_attempts:
                time.sleep(delay_seconds)

    logger.error("Database initialization failed after all attempts")
    return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_initialized

    db_initialized = try_init_db()

    yield


app = FastAPI(
    title="Yu-Gi-Oh Manager API",
    description="FastAPI Backend for YGO Cards, Collections, Decks, and Wishlists",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cards.router)
app.include_router(collection.router)
app.include_router(decks.router)
app.include_router(deck_cards.router)
app.include_router(needed_cards.router)
app.include_router(deck_usage.router)


@app.get("/healthz", tags=["health"])
def health_check():
    """
    Liveness check only.
    This should not depend on MariaDB.
    If this works, the Python process and HTTP server are alive.
    """
    return {"status": "ok", "service": "ygo-manager-backend"}


@app.get("/readyz", tags=["health"])
def readiness_check(response: Response):
    """
    Readiness check.
    This tells Kubernetes whether the backend can actually use MariaDB.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        return {
            "status": "ready",
            "database": "ok",
            "db_initialized": db_initialized,
        }

    except Exception as exc:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "not_ready",
            "database": "error",
            "detail": str(exc),
            "db_initialized": db_initialized,
        }


@app.get("/", tags=["health"])
def root():
    return {"message": "Yu-Gi-Oh Manager FastAPI Service is running."}
