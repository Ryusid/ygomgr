"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Card = {
  id: number;
  name: string;
  type: string | null;
  description: string | null;
  frame_type: string | null;
  race: string | null;
  attribute: string | null;
  archetype: string | null;
  atk: number | null;
  def: number | null;
  level: number | null;
  linkval: number | null;
  scale: number | null;
  image_url: string | null;
};

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

function CardBadges({ card }: { card: Card }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {card.frame_type && (
        <span className="rounded bg-purple-50 px-2 py-1 text-xs font-bold text-purple-700">
          {card.frame_type}
        </span>
      )}

      {card.type && (
        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
          {card.type}
        </span>
      )}

      {card.race && (
        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
          {card.race}
        </span>
      )}

      {card.attribute && (
        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
          {card.attribute}
        </span>
      )}

      {card.archetype && (
        <span className="rounded bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
          {card.archetype}
        </span>
      )}
    </div>
  );
}

function CardStats({ card }: { card: Card }) {
  const hasStats =
    card.atk !== null ||
    card.def !== null ||
    card.level !== null ||
    card.linkval !== null ||
    card.scale !== null;

  if (!hasStats) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-700">
      {card.atk !== null && <span>ATK {card.atk}</span>}
      {card.def !== null && <span>DEF {card.def}</span>}
      {card.level !== null && <span>Level {card.level}</span>}
      {card.linkval !== null && <span>Link {card.linkval}</span>}
      {card.scale !== null && <span>Scale {card.scale}</span>}
    </div>
  );
}

export default function NeededCardsPage() {
  const [neededCards, setNeededCards] = useState<NeededCard[]>([]);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("missing");
  const [loading, setLoading] = useState(true);

  async function loadNeededCards() {
    setLoading(true);

    const response = await fetch("/api/needed-cards");
    const data = await response.json();

    if (Array.isArray(data)) {
      setNeededCards(data);
    } else {
      setNeededCards([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadNeededCards();
  }, []);

  const totalMissingCopies = neededCards.reduce(
    (total, item) => total + item.missing_quantity,
    0
  );

  const filteredCards = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    let items = neededCards;

    if (normalizedQuery) {
      items = neededCards.filter((item) => {
        const searchable = [
          item.card.name,
          item.card.type,
          item.card.frame_type,
          item.card.race,
          item.card.attribute,
          item.card.archetype,
          ...item.decks.map((deck) => deck.deck_name),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(normalizedQuery);
      });
    }

    return [...items].sort((a, b) => {
      if (sortMode === "name") {
        return a.card.name.localeCompare(b.card.name);
      }

      if (sortMode === "needed") {
        return b.total_needed - a.total_needed;
      }

      return b.missing_quantity - a.missing_quantity;
    });
  }, [neededCards, query, sortMode]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Needed Cards
            </h1>

            <p className="mt-2 text-slate-600">
              Cards used in your decks but not covered by your collection.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <div className="rounded-xl bg-slate-100 px-4 py-2">
                <div className="text-xs font-bold text-slate-500">
                  Unique missing cards
                </div>
                <div className="text-xl font-black">{neededCards.length}</div>
              </div>

              <div className="rounded-xl bg-red-50 px-4 py-2">
                <div className="text-xs font-bold text-red-600">
                  Total missing copies
                </div>
                <div className="text-xl font-black text-red-700">
                  {totalMissingCopies}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/collection"
              className="rounded-xl border border-slate-300 px-4 py-2 font-bold hover:bg-slate-100"
            >
              Collection
            </Link>

            <Link
              href="/decks"
              className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-700"
            >
              Decks
            </Link>
          </div>
        </header>

        <section className="mb-5 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none ring-blue-500 focus:ring-2"
              placeholder="Filter by card, deck, archetype, type..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />

            <select
              className="rounded-xl border border-slate-300 px-4 py-3"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
            >
              <option value="missing">Sort: most missing</option>
              <option value="needed">Sort: most used in decks</option>
              <option value="name">Sort: name A-Z</option>
            </select>

            <button
              className="rounded-xl border border-slate-300 px-4 py-3 font-bold hover:bg-slate-100"
              onClick={loadNeededCards}
            >
              Refresh
            </button>
          </div>
        </section>

        {loading ? (
          <p className="rounded-2xl border bg-white p-5 shadow-sm">
            Loading needed cards...
          </p>
        ) : neededCards.length === 0 ? (
          <section className="rounded-2xl border bg-white p-8 text-center shadow-sm">
            <div className="text-3xl">✅</div>
            <h2 className="mt-3 text-2xl font-black">You have everything</h2>
            <p className="mt-2 text-slate-600">
              Based on your current decks and collection, no cards are missing.
            </p>
          </section>
        ) : filteredCards.length === 0 ? (
          <p className="rounded-2xl border bg-white p-5 shadow-sm">
            No missing cards match your filter.
          </p>
        ) : (
          <section className="space-y-3">
            {filteredCards.map((item) => (
              <article
                key={item.card_id}
                className="flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm md:flex-row md:items-start"
              >
                {item.card.image_url ? (
                  <img
                    src={item.card.image_url}
                    alt={item.card.name}
                    className="h-32 w-24 flex-shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="h-32 w-24 flex-shrink-0 rounded bg-slate-200" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-black leading-tight">
                        {item.card.name}
                      </h2>

                      <CardBadges card={item.card} />
                      <CardStats card={item.card} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-sm font-black">
                      <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                        <div className="text-xs">Owned</div>
                        <div className="text-lg">x{item.quantity_owned}</div>
                      </div>

                      <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                        <div className="text-xs">Needed</div>
                        <div className="text-lg">x{item.total_needed}</div>
                      </div>

                      <div className="rounded-xl bg-red-50 p-3 text-red-700">
                        <div className="text-xs">Missing</div>
                        <div className="text-lg">x{item.missing_quantity}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-3">
                    <div className="mb-2 text-sm font-black text-slate-700">
                      Used in decks
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.decks.map((deck) => (
                        <Link
                          key={deck.deck_id}
                          href={`/decks/${deck.deck_id}`}
                          className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-100"
                        >
                          {deck.deck_name} x{deck.quantity}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
