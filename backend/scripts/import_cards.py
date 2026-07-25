import os
import sys
import httpx
from datetime import datetime, timezone
from sqlalchemy.dialects.mysql import insert as mysql_insert
from sqlalchemy.orm import Session

# Add parent directory to sys.path so backend imports work
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.database import SessionLocal, engine, Base
from backend.models import Card

API_URL = "https://db.ygoprodeck.com/api/v7/cardinfo.php"

def chunk_list(lst, size):
    for i in range(0, len(lst), size):
        yield lst[i:i + size]

def import_cards():
    print("Ensure database tables exist...")
    Base.metadata.create_all(bind=engine)

    print("Fetching card dataset from YGOPRODeck API...")
    with httpx.Client(timeout=60.0) as client:
        resp = client.get(API_URL)
        if resp.status_code != 200:
            print(f"Error fetching cards: HTTP {resp.status_code}")
            sys.exit(1)
        data = resp.json().get("data", [])

    print(f"Downloaded {len(data)} cards. Processing...")

    now_iso = datetime.now(timezone.utc)
    card_dicts = []

    for card in data:
        images = card.get("card_images", [])
        image_url = None
        if images:
            image_url = images[0].get("image_url_small") or images[0].get("image_url")

        card_dicts.append({
            "id": card["id"],
            "name": card["name"],
            "type": card.get("type"),
            "description": card.get("desc"),
            "frame_type": card.get("frameType"),
            "race": card.get("race"),
            "attribute": card.get("attribute"),
            "archetype": card.get("archetype"),
            "atk": card.get("atk"),
            "def": card.get("def"),
            "def_val": card.get("def"),
            "level": card.get("level"),
            "linkval": card.get("linkval"),
            "scale": card.get("scale"),
            "image_url": image_url,
            "raw_json": card,
            "updated_at": now_iso,
        })

    session: Session = SessionLocal()
    try:
        chunks = list(chunk_list(card_dicts, 500))
        total_chunks = len(chunks)

        for idx, chunk in enumerate(chunks, 1):
            # If using MySQL / MariaDB, construct upsert query
            if engine.dialect.name in ("mysql", "mariadb"):
                stmt = mysql_insert(Card).values(chunk)
                update_dict = {
                    c.name: c for c in stmt.inserted if c.name != "id"
                }
                stmt = stmt.on_duplicate_key_update(**update_dict)
                session.execute(stmt)
            else:
                # SQLite / Generic fallback
                for item in chunk:
                    c = session.query(Card).filter(Card.id == item["id"]).first()
                    if c:
                        for k, v in item.items():
                            setattr(c, k, v)
                    else:
                        c = Card(**item)
                        session.add(c)

            session.commit()
            print(f"Imported chunk {idx}/{total_chunks} ({len(chunk)} cards)")

        print("Successfully imported all Yu-Gi-Oh cards into MariaDB.")
    except Exception as e:
        session.rollback()
        print(f"Error during import: {e}")
        raise e
    finally:
        session.close()

if __name__ == "__main__":
    import_cards()
