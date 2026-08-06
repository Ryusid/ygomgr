"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CardImage from "@/components/CardImage";
import CardPreview, { Card } from "@/components/CardPreview";

type NeededCard = {
  card_id: number;
  missing_quantity: number;
  total_needed: number;
  quantity_owned: number;
  card: Card;
  decks: {
    deck_id: string;
    deck_name: string;
    quantity: number;
  }[];
};

type SortMode = "missing" | "name" | "needed";

export default function NeededCardsPage() {
  const [neededCards, setNeededCards] = useState<NeededCard[]>([]);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("missing");
  const [spotlightCard, setSpotlightCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadNeededCards() {
    setLoading(true);
    try {
      const response = await fetch("/api/needed-cards");
      const data = await response.json();
      if (Array.isArray(data)) {
        setNeededCards(data);
        if (data.length > 0 && !spotlightCard) {
          setSpotlightCard(data[0].card);
        }
      }
    } catch (err) {
      console.error(err);
      setNeededCards([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNeededCards();
  }, []);

  const totalMissingCopies = neededCards.reduce((total, item) => total + item.missing_quantity, 0);

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    let items = neededCards;

    if (q) {
      items = neededCards.filter((item) => {
        const text = [
          item.card.name,
          item.card.type,
          item.card.race,
          item.card.attribute,
          item.card.archetype,
          ...item.decks.map((d) => d.deck_name),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return text.includes(q);
      });
    }

    return [...items].sort((a, b) => {
      if (sortMode === "name") return a.card.name.localeCompare(b.card.name);
      if (sortMode === "needed") return b.total_needed - a.total_needed;
      return b.missing_quantity - a.missing_quantity;
    });
  }, [neededCards, query, sortMode]);

  const currentSpotlightNeeded = useMemo(() => {
    if (!spotlightCard) return null;
    return neededCards.find((item) => item.card_id === spotlightCard.id) || null;
  }, [spotlightCard, neededCards]);

  return (
    <main className="p-4 lg:p-6 max-w-[1800px] mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-[#0f172a] via-[#131d35] to-[#0f172a] p-6 shadow-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💎</span>
            <h1 className="text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500">
              MISSING CARDS & WISHLIST
            </h1>
          </div>
          <p className="text-xs lg:text-sm text-slate-400 mt-1">
            Calculated missing cards required across all your constructed decks vs owned collection.
          </p>
        </div>

        {/* Counters */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-center min-w-28 shadow-lg shadow-amber-500/5">
            <div className="text-[10px] font-extrabold text-amber-400/80 uppercase tracking-widest">
              Unique Missing
            </div>
            <div className="text-xl font-black text-amber-300">{neededCards.length}</div>
          </div>
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-center min-w-28 shadow-lg shadow-rose-500/5">
            <div className="text-[10px] font-extrabold text-rose-400/80 uppercase tracking-widest">
              Total Copies Needed
            </div>
            <div className="text-xl font-black text-rose-300">{totalMissingCopies}</div>
          </div>
        </div>
      </div>

      {/* Filter and Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 backdrop-blur-md">
        <input
          type="text"
          placeholder="Filter missing cards or deck names..."
          className="flex-1 rounded-xl border border-slate-700/80 bg-slate-950 px-4 py-2 text-xs font-medium text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="flex items-center gap-2">
          <select
            className="rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
          >
            <option value="missing">Sort: Most Copies Missing</option>
            <option value="needed">Sort: Most Needed in Decks</option>
            <option value="name">Sort: Name A-Z</option>
          </select>

          <button
            onClick={loadNeededCards}
            className="rounded-xl border border-slate-700/80 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Left Column: Missing Cards List */}
        <section className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-12 text-center text-slate-500">
              Calculating missing cards...
            </div>
          ) : neededCards.length === 0 ? (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-12 text-center text-slate-500">
              <div className="text-4xl mb-2">🎉</div>
              <div className="font-bold text-sm text-slate-300">Complete Collection!</div>
              <p className="text-xs mt-1">You own enough cards to fulfill all constructed decks.</p>
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 text-center text-slate-500 text-xs">
              No missing cards match your filter criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredCards.map((item) => (
                <div
                  key={item.card_id}
                  className={`group relative cursor-pointer flex gap-3.5 rounded-2xl border p-3.5 transition backdrop-blur-md ${
                    spotlightCard?.id === item.card_id
                      ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                      : "border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60"
                  }`}
                  onClick={() => setSpotlightCard(item.card)}
                >
                  <CardImage
                    src={item.card.image_url}
                    alt={item.card.name}
                    frameType={item.card.frame_type}
                    missing={item.missing_quantity}
                    size="md"
                  />

                  <div className="min-w-0 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="line-clamp-1 text-sm font-black text-slate-100 group-hover:text-amber-300">
                        {item.card.name}
                      </h3>

                      <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-bold">
                        <span className="rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5">
                          Missing: x{item.missing_quantity}
                        </span>
                        <span className="rounded bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5">
                          Owned: x{item.quantity_owned}
                        </span>
                        <span className="rounded bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5">
                          Max Single Deck: x{item.total_needed}
                        </span>
                      </div>
                    </div>

                    {/* Decks utilizing card */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Decks Requiring Card:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.decks.map((deck) => (
                          <Link
                            key={deck.deck_id}
                            href={`/decks/${deck.deck_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-md bg-slate-950 border border-slate-700/80 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:border-amber-500 transition"
                          >
                            {deck.deck_name} (x{deck.quantity})
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Card Spotlight */}
        <aside className="sticky top-6">
          <CardPreview
            card={spotlightCard}
            ownedQuantity={currentSpotlightNeeded?.quantity_owned ?? 0}
            deckQuantity={currentSpotlightNeeded?.total_needed ?? 0}
            missingQuantity={currentSpotlightNeeded?.missing_quantity ?? 0}
            otherDecksText={currentSpotlightNeeded?.decks
              .map((d) => `${d.deck_name} x${d.quantity}`)
              .join(", ")}
          />
        </aside>
      </div>
    </main>
  );
}
