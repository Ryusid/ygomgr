"use client";

import { useEffect, useMemo, useState } from "react";
import CardImage from "@/components/CardImage";
import CardPreview, { Card } from "@/components/CardPreview";
import SearchPanel, { FilterState } from "@/components/SearchPanel";

type CollectionItem = {
  card_id: number;
  quantity_owned: number;
  updated_at: string;
  card: Card;
};

type SortMode = "recent" | "name" | "quantity";

function isCard(value: unknown): value is Card {
  if (!value || typeof value !== "object") return false;
  const card = value as Partial<Card>;
  return typeof card.id === "number" && typeof card.name === "string";
}

function isCollectionItem(value: unknown): value is CollectionItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CollectionItem>;
  return (
    typeof item.card_id === "number" &&
    typeof item.quantity_owned === "number" &&
    typeof item.updated_at === "string" &&
    isCard(item.card)
  );
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

export default function CollectionPage() {
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [searchFilters, setSearchFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [spotlightCard, setSpotlightCard] = useState<Card | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [collectionFilter, setCollectionFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadCollection() {
    try {
      const response = await fetch("/api/collection", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load collection: ${response.status}`);
      }
      const data: unknown = await response.json();
      if (Array.isArray(data)) {
        const valid = data.filter(isCollectionItem);
        setCollection(valid);
        if (valid.length > 0 && !spotlightCard) {
          setSpotlightCard(valid[0].card);
        }
      }
      setError("");
    } catch (err) {
      console.error(err);
      setError("Could not load collection");
    }
  }

  useEffect(() => {
    loadCollection();
  }, []);

  // Card Search Debounce
  useEffect(() => {
    const timeout = setTimeout(async () => {
      const params = new URLSearchParams();
      const q = searchFilters.query.trim();

      if (q.length >= 2) params.set("q", q);
      if (searchFilters.type !== "all") params.set("type", searchFilters.type);
      if (searchFilters.race !== "all") params.set("race", searchFilters.race);
      if (searchFilters.attribute !== "all") params.set("attribute", searchFilters.attribute);
      if (searchFilters.archetype.trim()) params.set("archetype", searchFilters.archetype.trim());
      if (searchFilters.minAtk) params.set("minAtk", searchFilters.minAtk);
      if (searchFilters.maxAtk) params.set("maxAtk", searchFilters.maxAtk);
      if (searchFilters.minDef) params.set("minDef", searchFilters.minDef);
      if (searchFilters.maxDef) params.set("maxDef", searchFilters.maxDef);
      if (searchFilters.minLevel) params.set("minLevel", searchFilters.minLevel);
      if (searchFilters.maxLevel) params.set("maxLevel", searchFilters.maxLevel);

      if (params.toString() === "") {
        setSearchResults([]);
        return;
      }

      try {
        const res = await fetch(`/api/cards/search?${params.toString()}`);
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

  async function updateQuantity(card: Card, newQty: number) {
    setLoading(true);
    try {
      const response = await fetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: card.id,
          quantity_owned: newQty,
        }),
      });

      if (!response.ok) {
        throw new Error("Update failed");
      }

      await loadCollection();
    } catch (err) {
      console.error(err);
      setError("Failed to update collection quantity");
    } finally {
      setLoading(false);
    }
  }

  function getOwnedQty(cardId: number): number {
    return collection.find((item) => item.card_id === cardId)?.quantity_owned ?? 0;
  }

  const totalUnique = collection.length;
  const totalCopies = collection.reduce((acc, curr) => acc + curr.quantity_owned, 0);

  const filteredCollection = useMemo(() => {
    const q = collectionFilter.trim().toLowerCase();
    let list = collection;

    if (q) {
      list = collection.filter((item) => {
        const c = item.card;
        const text = [c.name, c.type, c.race, c.attribute, c.archetype]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return text.includes(q);
      });
    }

    return [...list].sort((a, b) => {
      if (sortMode === "name") return a.card.name.localeCompare(b.card.name);
      if (sortMode === "quantity") return b.quantity_owned - a.quantity_owned;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [collection, collectionFilter, sortMode]);

  return (
    <main className="p-4 lg:p-6 max-w-[1800px] mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-[#0f172a] via-[#131d35] to-[#0f172a] p-6 shadow-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎴</span>
            <h1 className="text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500">
              CARD VAULT & COLLECTION
            </h1>
          </div>
          <p className="text-xs lg:text-sm text-slate-400 mt-1">
            Search the Yu-Gi-Oh! card database, register owned copies, and manage your vault.
          </p>
        </div>

        {/* Stats counters */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-center min-w-28 shadow-lg shadow-amber-500/5">
            <div className="text-[10px] font-extrabold text-amber-400/80 uppercase tracking-widest">
              Unique Cards
            </div>
            <div className="text-xl font-black text-amber-300">{totalUnique}</div>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-center min-w-28 shadow-lg shadow-blue-500/5">
            <div className="text-[10px] font-extrabold text-blue-400/80 uppercase tracking-widest">
              Total Copies
            </div>
            <div className="text-xl font-black text-blue-300">{totalCopies}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/50 bg-rose-950/40 p-4 text-xs font-bold text-rose-300">
          ⚠️ {error}
        </div>
      )}

      {/* Database Search Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-black text-slate-200 flex items-center gap-2">
          <span>➕</span> Add Cards to Vault
        </h2>

        <SearchPanel
          filters={searchFilters}
          onChange={setSearchFilters}
          onReset={() => setSearchFilters(DEFAULT_FILTERS)}
          placeholder="Search card database to add..."
        />

        {/* Search Results Grid */}
        {searchResults.length > 0 && (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 shadow-2xl space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Search Results ({searchResults.length})
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              {searchResults.map((card) => {
                const owned = getOwnedQty(card.id);
                return (
                  <div
                    key={card.id}
                    className="group relative cursor-pointer flex flex-col items-center card-hover-effect"
                    onClick={() => setSpotlightCard(card)}
                  >
                    <CardImage
                      src={card.image_url}
                      alt={card.name}
                      frameType={card.frame_type}
                      quantity={owned}
                      size="full"
                    />
                    <div className="mt-1 text-center w-full">
                      <div className="line-clamp-1 text-[11px] font-bold text-slate-200 group-hover:text-amber-300">
                        {card.name}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(card, owned + 1);
                        }}
                        disabled={loading}
                        className="mt-1 w-full rounded-md border border-amber-500/40 bg-amber-500/20 py-0.5 text-[10px] font-black text-amber-300 hover:bg-amber-500/40 transition disabled:opacity-50"
                      >
                        + Add 1
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Collection Grid + Spotlight Preview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Left Column: Collection Grid */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 backdrop-blur-md">
            <h2 className="text-lg font-black text-slate-200 flex items-center gap-2">
              <span>📚</span> Vault Contents ({filteredCollection.length})
            </h2>

            <div className="flex items-center gap-2.5">
              <input
                type="text"
                placeholder="Filter vault..."
                className="rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                value={collectionFilter}
                onChange={(e) => setCollectionFilter(e.target.value)}
              />

              <select
                className="rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
              >
                <option value="recent">Recently Added</option>
                <option value="name">Name A-Z</option>
                <option value="quantity">Highest Quantity</option>
              </select>
            </div>
          </div>

          {filteredCollection.length === 0 ? (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-12 text-center text-slate-500">
              <div className="text-4xl mb-2">📭</div>
              <div className="font-bold text-sm text-slate-400">Vault is Empty</div>
              <p className="text-xs mt-1">Search the database above to start adding cards to your collection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {filteredCollection.map((item) => (
                <div
                  key={item.card_id}
                  className={`group relative cursor-pointer flex flex-col items-center p-1.5 rounded-xl border transition ${
                    spotlightCard?.id === item.card_id
                      ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                      : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/60"
                  }`}
                  onClick={() => setSpotlightCard(item.card)}
                >
                  <CardImage
                    src={item.card.image_url}
                    alt={item.card.name}
                    frameType={item.card.frame_type}
                    quantity={item.quantity_owned}
                    size="full"
                  />
                  
                  <div className="mt-1 text-center w-full">
                    <div className="line-clamp-1 text-[11px] font-bold text-slate-200">
                      {item.card.name}
                    </div>

                    <div className="mt-1.5 flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.card, Math.max(0, item.quantity_owned - 1));
                        }}
                        disabled={loading}
                        className="h-6 w-6 rounded bg-slate-800 text-xs font-black text-slate-300 hover:bg-slate-700 border border-slate-700"
                      >
                        -
                      </button>
                      <span className="min-w-6 text-center text-xs font-black text-amber-300">
                        {item.quantity_owned}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.card, item.quantity_owned + 1);
                        }}
                        disabled={loading}
                        className="h-6 w-6 rounded bg-slate-800 text-xs font-black text-slate-300 hover:bg-slate-700 border border-slate-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Card Preview Spotlight */}
        <aside className="sticky top-6">
          <CardPreview
            card={spotlightCard}
            ownedQuantity={spotlightCard ? getOwnedQty(spotlightCard.id) : 0}
          />
        </aside>
      </div>
    </main>
  );
}
