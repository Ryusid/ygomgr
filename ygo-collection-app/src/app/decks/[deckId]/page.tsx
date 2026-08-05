"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, MouseEvent } from "react";
import CardImage from "@/components/CardImage";
import CardPreview, { Card } from "@/components/CardPreview";
import SearchPanel, { FilterState } from "@/components/SearchPanel";

type Section = "main" | "extra" | "side";

type DeckUsageEntry = {
  card_id: number;
  quantity_used_elsewhere: number;
  decks: {
    deck_id: string;
    deck_name: string;
    quantity: number;
  }[];
};

type DeckCard = {
  id: string;
  quantity: number;
  section: Section;
  card: Card;
};

type Deck = {
  id: string;
  name: string;
  created_at: string;
  deck_cards: DeckCard[];
};

type CollectionItem = {
  card_id: number;
  quantity_owned: number;
  card: Card;
};

function isCard(value: unknown): value is Card {
  if (!value || typeof value !== "object") return false;
  const card = value as Partial<Card>;
  return typeof card.id === "number" && typeof card.name === "string";
}

function isDeckCard(value: unknown): value is DeckCard {
  if (!value || typeof value !== "object") return false;
  const dc = value as Partial<DeckCard>;
  return (
    typeof dc.id === "string" &&
    typeof dc.quantity === "number" &&
    (dc.section === "main" || dc.section === "extra" || dc.section === "side") &&
    isCard(dc.card)
  );
}

function isCollectionItem(value: unknown): value is CollectionItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CollectionItem>;
  return typeof item.card_id === "number" && typeof item.quantity_owned === "number" && isCard(item.card);
}

function isDeckUsageEntry(value: unknown): value is DeckUsageEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<DeckUsageEntry>;
  return typeof entry.card_id === "number" && typeof entry.quantity_used_elsewhere === "number";
}

const DEFAULT_FILTERS: FilterState = {
  query: "",
  type: "all",
  race: "all",
  attribute: "all",
  archetype: "",
  minAtk: "",
  maxAtk: "",
  minDef: "",
  maxDef: "",
  minLevel: "",
  maxLevel: "",
};

function getAutoSection(card: Card): Section {
  const frameType = card.frame_type?.toLowerCase() ?? "";
  const type = card.type?.toLowerCase() ?? "";
  const value = `${frameType} ${type}`;

  if (
    value.includes("fusion") ||
    value.includes("synchro") ||
    value.includes("xyz") ||
    value.includes("link")
  ) {
    return "extra";
  }

  return "main";
}

export default function DeckEditorPage() {
  const params = useParams();
  const deckId = String(params.deckId);

  const [deck, setDeck] = useState<Deck | null>(null);
  const [deckName, setDeckName] = useState("");
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [deckUsage, setDeckUsage] = useState<DeckUsageEntry[]>([]);
  const [spotlightCard, setSpotlightCard] = useState<Card | null>(null);
  const [searchFilters, setSearchFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadDeckData() {
    try {
      // 1. Load Deck Detail
      const deckRes = await fetch(`/api/decks/${deckId}`, { cache: "no-store" });
      if (!deckRes.ok) throw new Error("Failed to load deck");
      const deckData = await deckRes.json();
      const validDeckCards = Array.isArray(deckData.deck_cards)
        ? deckData.deck_cards.filter(isDeckCard)
        : [];
      setDeck({
        id: String(deckData.id),
        name: String(deckData.name),
        created_at: String(deckData.created_at ?? ""),
        deck_cards: validDeckCards,
      });
      setDeckName(String(deckData.name));

      // 2. Load Collection
      const colRes = await fetch("/api/collection", { cache: "no-store" });
      if (colRes.ok) {
        const colData = await colRes.json();
        setCollection(Array.isArray(colData) ? colData.filter(isCollectionItem) : []);
      }

      // 3. Load Deck Usage
      const usageRes = await fetch(`/api/deck-usage?excludeDeckId=${encodeURIComponent(deckId)}`);
      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setDeckUsage(Array.isArray(usageData) ? usageData.filter(isDeckUsageEntry) : []);
      }

      setError("");
    } catch (err) {
      console.error(err);
      setError("Could not load deck details");
    }
  }

  useEffect(() => {
    loadDeckData();
  }, [deckId]);

  // Card Search Debounce
  useEffect(() => {
    const timeout = setTimeout(async () => {
      const p = new URLSearchParams();
      const q = searchFilters.query.trim();

      if (q.length >= 2) p.set("q", q);
      if (searchFilters.type !== "all") p.set("type", searchFilters.type);
      if (searchFilters.race !== "all") p.set("race", searchFilters.race);
      if (searchFilters.attribute !== "all") p.set("attribute", searchFilters.attribute);
      if (searchFilters.archetype.trim()) p.set("archetype", searchFilters.archetype.trim());
      if (searchFilters.minAtk) p.set("minAtk", searchFilters.minAtk);
      if (searchFilters.maxAtk) p.set("maxAtk", searchFilters.maxAtk);
      if (searchFilters.minDef) p.set("minDef", searchFilters.minDef);
      if (searchFilters.maxDef) p.set("maxDef", searchFilters.maxDef);
      if (searchFilters.minLevel) p.set("minLevel", searchFilters.minLevel);
      if (searchFilters.maxLevel) p.set("maxLevel", searchFilters.maxLevel);

      if (p.toString() === "") {
        setSearchResults([]);
        return;
      }

      try {
        const res = await fetch(`/api/cards/search?${p.toString()}`);
        if (res.ok) {
          const data: unknown = await res.json();
          setSearchResults(Array.isArray(data) ? data.filter(isCard) : []);
        }
      } catch (err) {
        console.error(err);
        setSearchResults([]);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchFilters]);

  const deckCards = deck?.deck_cards ?? [];

  const groupedCards = useMemo(() => {
    const sortCards = (list: DeckCard[]) =>
      [...list].filter((item) => item?.card).sort((a, b) => a.card.name.localeCompare(b.card.name));

    return {
      main: sortCards(deckCards.filter((item) => item.section === "main")),
      extra: sortCards(deckCards.filter((item) => item.section === "extra")),
      side: sortCards(deckCards.filter((item) => item.section === "side")),
    };
  }, [deckCards]);

  function getOwnedQuantity(cardId: number) {
    return collection.find((item) => item.card_id === cardId)?.quantity_owned ?? 0;
  }

  function getQuantityInDeck(cardId: number) {
    return deckCards
      .filter((item) => item.card.id === cardId)
      .reduce((total, item) => total + item.quantity, 0);
  }

  function getUsedElsewhere(cardId: number) {
    return deckUsage.find((item) => item.card_id === cardId)?.quantity_used_elsewhere ?? 0;
  }

  function getMissingQuantity(cardId: number) {
    const owned = getOwnedQuantity(cardId);
    const inDeck = getQuantityInDeck(cardId);
    const elsewhere = getUsedElsewhere(cardId);
    return Math.max(0, inDeck + elsewhere - owned);
  }

  function countSection(section: Section) {
    return deckCards
      .filter((item) => item.section === section)
      .reduce((total, item) => total + item.quantity, 0);
  }

  async function addCardToDeck(card: Card, section: Section) {
    if (!deck) return;
    setLoading(true);

    try {
      const existing = deck.deck_cards.find(
        (item) => item.card.id === card.id && item.section === section
      );

      const res = existing
        ? await fetch(`/api/decks/cards/${existing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: existing.quantity + 1 }),
          })
        : await fetch(`/api/decks/${deckId}/cards`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ card_id: card.id, quantity: 1, section }),
          });

      if (!res.ok) throw new Error("Failed to add card");

      setSpotlightCard(card);
      await loadDeckData();
    } catch (err) {
      console.error(err);
      setError("Could not add card to deck");
    } finally {
      setLoading(false);
    }
  }

  async function updateDeckCardQuantity(deckCard: DeckCard, quantity: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/decks/cards/${deckCard.id}`, {
        method: quantity <= 0 ? "DELETE" : "PATCH",
        headers: quantity <= 0 ? undefined : { "Content-Type": "application/json" },
        body: quantity <= 0 ? undefined : JSON.stringify({ quantity }),
      });

      if (!res.ok) throw new Error("Failed to update card quantity");
      await loadDeckData();
    } catch (err) {
      console.error(err);
      setError("Could not update card quantity");
    } finally {
      setLoading(false);
    }
  }

  async function renameDeck() {
    const name = deckName.trim();
    if (!name) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/decks/${deckId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Rename failed");
      await loadDeckData();
    } catch (err) {
      console.error(err);
      setError("Failed to rename deck");
    } finally {
      setLoading(false);
    }
  }

  function handleRightClickCard(e: MouseEvent, card: Card) {
    e.preventDefault();
    const section: Section = e.altKey ? "side" : getAutoSection(card);
    addCardToDeck(card, section);
  }

  function renderDeckSection(title: string, section: Section, cards: DeckCard[]) {
    const count = countSection(section);
    return (
      <section className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">
              {title}
            </h2>
          </div>
          <span className="rounded-md bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-xs font-black text-amber-300">
            {count} / {section === "main" ? "60" : "15"}
          </span>
        </div>

        {cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
            No cards in {title}. Search cards on the right and right-click to add.
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {cards.map((deckCard) => {
              const card = deckCard.card;
              const missing = getMissingQuantity(card.id);
              return (
                <div
                  key={deckCard.id}
                  className={`group relative cursor-pointer flex flex-col items-center p-1 rounded-lg border transition ${
                    spotlightCard?.id === card.id
                      ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                      : missing > 0
                      ? "border-rose-500/60 bg-rose-950/20"
                      : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                  }`}
                  onClick={() => setSpotlightCard(card)}
                >
                  <CardImage
                    src={card.image_url}
                    alt={card.name}
                    frameType={card.frame_type}
                    quantity={deckCard.quantity}
                    missing={missing}
                    size="full"
                  />

                  {/* Quick Increment/Decrement Overlay on Hover */}
                  <div className="mt-1 flex items-center justify-center gap-1 w-full">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDeckCardQuantity(deckCard, deckCard.quantity - 1);
                      }}
                      disabled={loading}
                      className="h-5 w-5 rounded bg-slate-800 text-[10px] font-black text-slate-300 hover:bg-slate-700 border border-slate-700"
                    >
                      -
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDeckCardQuantity(deckCard, deckCard.quantity + 1);
                      }}
                      disabled={loading}
                      className="h-5 w-5 rounded bg-slate-800 text-[10px] font-black text-slate-300 hover:bg-slate-700 border border-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  if (!deck) {
    return (
      <main className="p-6 text-center text-slate-400">
        {error || "Loading Master Deck Builder..."}
      </main>
    );
  }

  return (
    <main className="p-4 lg:p-6 max-w-[1800px] mx-auto space-y-6">
      {/* Deck Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-[#0f172a] via-[#131d35] to-[#0f172a] p-5 shadow-2xl backdrop-blur-md">
        <div>
          <Link
            href="/decks"
            className="text-xs font-bold text-amber-400 hover:underline mb-1 inline-block"
          >
            ← Back to All Decks
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-100">{deck.name}</h1>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <span className="rounded bg-slate-800 px-2 py-0.5 border border-slate-700 text-slate-300">
                Main: {countSection("main")}
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 border border-slate-700 text-slate-300">
                Extra: {countSection("extra")}
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 border border-slate-700 text-slate-300">
                Side: {countSection("side")}
              </span>
            </div>
          </div>
        </div>

        {/* Rename deck control */}
        <div className="flex items-center gap-2">
          <input
            className="rounded-xl border border-slate-700/80 bg-slate-950 px-3.5 py-2 text-xs font-medium text-slate-100 outline-none focus:border-amber-500"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
          />
          <button
            onClick={renameDeck}
            disabled={loading}
            className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-slate-700 transition"
          >
            Rename
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/50 bg-rose-950/40 p-4 text-xs font-bold text-rose-300">
          ⚠️ {error}
        </div>
      )}

      {/* 3-Column Layout: Preview Spotlight (Left) | Deck Contents (Middle) | Card Search (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] 2xl:grid-cols-[320px_1fr_380px] gap-5 items-start">
        {/* Left Column: Spotlight Card Preview */}
        <aside className="lg:sticky lg:top-4 self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto pr-0.5">
          <CardPreview
            card={spotlightCard}
            ownedQuantity={spotlightCard ? getOwnedQuantity(spotlightCard.id) : 0}
            deckQuantity={spotlightCard ? getQuantityInDeck(spotlightCard.id) : 0}
            usedElsewhereQuantity={spotlightCard ? getUsedElsewhere(spotlightCard.id) : 0}
            missingQuantity={spotlightCard ? getMissingQuantity(spotlightCard.id) : 0}
          />
        </aside>

        {/* Middle Column: Main / Extra / Side Deck Grids stacked on top of each other */}
        <div className="space-y-4 min-w-0">
          {renderDeckSection("Main Deck", "main", groupedCards.main)}
          {renderDeckSection("Extra Deck", "extra", groupedCards.extra)}
          {renderDeckSection("Side Deck", "side", groupedCards.side)}
        </div>

        {/* Right Column: Card Search & Quick-Add */}
        <aside className="lg:sticky lg:top-4 self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto space-y-4 pr-0.5">
          <SearchPanel
            filters={searchFilters}
            onChange={setSearchFilters}
            onReset={() => setSearchFilters(DEFAULT_FILTERS)}
            placeholder="Search cards to add..."
            compact
          />

          {/* Search Results Grid */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Card Search ({searchResults.length})</span>
              <span className="text-[10px] text-amber-400">Right-click = Add</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                Type a card name or adjust search filters to display cards.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                {searchResults.map((card) => {
                  const owned = getOwnedQuantity(card.id);
                  const inDeck = getQuantityInDeck(card.id);
                  const missing = getMissingQuantity(card.id);
                  return (
                    <div
                      key={card.id}
                      className="group relative cursor-pointer flex flex-col items-center card-hover-effect"
                      onClick={() => setSpotlightCard(card)}
                      onContextMenu={(e) => handleRightClickCard(e, card)}
                      title="Left-click: Preview | Right-click: Auto Add to Deck | Alt+Right-click: Add to Side"
                    >
                      <CardImage
                        src={card.image_url}
                        alt={card.name}
                        frameType={card.frame_type}
                        quantity={inDeck}
                        missing={missing}
                        size="full"
                      />
                      <div className="mt-1 text-center w-full">
                        <div className="line-clamp-1 text-[10px] font-bold text-slate-300 group-hover:text-amber-300">
                          {card.name}
                        </div>
                        <div className="text-[9px] text-slate-500">Owned: x{owned}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
