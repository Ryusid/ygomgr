import os
import sys
import httpx
from datetime import datetime, timezone
from sqlalchemy.orm import Session

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.database import SessionLocal, engine, Base
from backend.models import Card, CollectionCard, Deck, DeckCard

def get_env_var(name, default=""):
    return os.getenv(name, default)

def parse_env_file(filepath):
    env_vars = {}
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    env_vars[key.strip()] = val.strip().strip('"').strip("'")
    return env_vars

def migrate():
    print("=== Supabase to MariaDB Data Migration Tool ===")
    
    # Try reading env vars from .env.local in frontend or current env
    env_local_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../ygo-collection-app/.env.local"))
    env_vars = parse_env_file(env_local_path)

    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or env_vars.get("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or env_vars.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        print(f"Error: Missing Supabase credentials. Checked environment and '{env_local_path}'.")
        print("Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
        sys.exit(1)

    print(f"Connecting to Supabase at: {supabase_url}")

    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
    }

    session: Session = SessionLocal()
    Base.metadata.create_all(bind=engine)

    try:
        with httpx.Client(timeout=30.0, headers=headers) as client:
            # 1. Fetch collection_cards
            print("\n1. Fetching collection cards from Supabase...")
            resp = client.get(f"{supabase_url}/rest/v1/collection_cards?select=*")
            if resp.status_code != 200:
                print(f"Failed to fetch collection_cards from Supabase: {resp.status_code} {resp.text}")
                collection_rows = []
            else:
                collection_rows = resp.json()
            print(f"Found {len(collection_rows)} collection entries.")

            # 2. Fetch decks
            print("\n2. Fetching decks from Supabase...")
            resp = client.get(f"{supabase_url}/rest/v1/decks?select=*")
            if resp.status_code != 200:
                print(f"Failed to fetch decks from Supabase: {resp.status_code} {resp.text}")
                deck_rows = []
            else:
                deck_rows = resp.json()
            print(f"Found {len(deck_rows)} decks.")

            # 3. Fetch deck_cards
            print("\n3. Fetching deck cards from Supabase...")
            resp = client.get(f"{supabase_url}/rest/v1/deck_cards?select=*")
            if resp.status_code != 200:
                print(f"Failed to fetch deck_cards from Supabase: {resp.status_code} {resp.text}")
                deck_card_rows = []
            else:
                deck_card_rows = resp.json()
            print(f"Found {len(deck_card_rows)} deck cards.")

            # Check if all referenced cards exist in MariaDB; if not, report warning
            card_ids = set()
            for r in collection_rows:
                card_ids.add(r["card_id"])
            for r in deck_card_rows:
                card_ids.add(r["card_id"])

            existing_cards = {c.id for c in session.query(Card.id).filter(Card.id.in_(list(card_ids))).all()} if card_ids else set()
            missing_card_ids = card_ids - existing_cards

            if missing_card_ids:
                print(f"\nNotice: {len(missing_card_ids)} cards referenced in collection/decks are missing in MariaDB.")
                print("Tip: Run `python backend/scripts/import_cards.py` to populate all YGOPRODeck cards.")

            # Insert / Upsert collection cards
            print("\nMigrating collection cards to MariaDB...")
            col_migrated = 0
            for row in collection_rows:
                owner_id = row.get("owner_id", "local")
                card_id = row["card_id"]
                quantity = row.get("quantity_owned", 1)
                
                existing_col = session.query(CollectionCard).filter(
                    CollectionCard.owner_id == owner_id,
                    CollectionCard.card_id == card_id
                ).first()

                if existing_col:
                    existing_col.quantity_owned = quantity
                else:
                    new_col = CollectionCard(
                        owner_id=owner_id,
                        card_id=card_id,
                        quantity_owned=quantity,
                        updated_at=datetime.now(timezone.utc)
                    )
                    session.add(new_col)
                col_migrated += 1

            # Insert / Upsert decks
            print("\nMigrating decks to MariaDB...")
            deck_migrated = 0
            for row in deck_rows:
                d_id = str(row["id"])
                owner_id = row.get("owner_id", "local")
                name = row.get("name", "Untitled Deck")

                existing_d = session.query(Deck).filter(Deck.id == d_id).first()
                if existing_d:
                    existing_d.name = name
                else:
                    new_d = Deck(
                        id=d_id,
                        owner_id=owner_id,
                        name=name,
                        created_at=datetime.now(timezone.utc)
                    )
                    session.add(new_d)
                deck_migrated += 1

            # Insert / Upsert deck cards
            print("\nMigrating deck cards to MariaDB...")
            dc_migrated = 0
            for row in deck_card_rows:
                dc_id = str(row.get("id", ""))
                deck_id = str(row["deck_id"])
                card_id = row["card_id"]
                quantity = row.get("quantity", 1)
                section = row.get("section", "main")

                existing_dc = session.query(DeckCard).filter(
                    DeckCard.deck_id == deck_id,
                    DeckCard.card_id == card_id,
                    DeckCard.section == section
                ).first()

                if existing_dc:
                    existing_dc.quantity = quantity
                else:
                    new_dc = DeckCard(
                        id=dc_id if dc_id else None,
                        deck_id=deck_id,
                        card_id=card_id,
                        quantity=quantity,
                        section=section
                    )
                    session.add(new_dc)
                dc_migrated += 1

            session.commit()
            print(f"\nMigration completed successfully!")
            print(f"  - Collection entries: {col_migrated}")
            print(f"  - Decks: {deck_migrated}")
            print(f"  - Deck cards: {dc_migrated}")

    except Exception as e:
        session.rollback()
        print(f"\nMigration failed with error: {e}")
        sys.exit(1)
    finally:
        session.close()

if __name__ == "__main__":
    migrate()
