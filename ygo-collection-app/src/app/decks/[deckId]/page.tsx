"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";

type Section = "main" | "extra" | "side";

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

  const deckCard = value as Partial<DeckCard>;
  return (
    typeof deckCard.id === "string" &&
    typeof deckCard.quantity === "number" &&
    (deckCard.section === "main" ||
      deckCard.section === "extra" ||
      deckCard.section === "side") &&
    isCard(deckCard.card)
  );
}

function isCollectionItem(value: unknown): value is CollectionItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<CollectionItem>;
  return (
    typeof item.card_id === "number" &&
    typeof item.quantity_owned === "number" &&
    isCard(item.card)
  );
}

function isDeckUsageEntry(value: unknown): value is DeckUsageEntry {
  if (!value || typeof value !== "object") return false;

  const entry = value as Partial<DeckUsageEntry>;
  return (
    typeof entry.card_id === "number" &&
    typeof entry.quantity_used_elsewhere === "number" &&
    Array.isArray(entry.decks)
  );
}

const CARD_TYPES = [
  "Effect Monster",
  "Normal Monster",
  "Ritual Monster",
  "Fusion Monster",
  "Synchro Monster",
  "XYZ Monster",
  "Pendulum Effect Monster",
  "Link Monster",
  "Spell Card",
  "Trap Card",
];

const RACES_AND_SUBTYPES = [
  "Dragon",
  "Spellcaster",
  "Warrior",
  "Machine",
  "Fiend",
  "Fairy",
  "Zombie",
  "Beast",
  "Beast-Warrior",
  "Winged Beast",
  "Aqua",
  "Pyro",
  "Thunder",
  "Rock",
  "Plant",
  "Insect",
  "Fish",
  "Sea Serpent",
  "Reptile",
  "Psychic",
  "Dinosaur",
  "Cyberse",
  "Wyrm",
  "Divine-Beast",
  "Field",
  "Equip",
  "Quick-Play",
  "Continuous",
  "Ritual",
  "Counter",
  "Normal",
];

const ATTRIBUTES = ["DARK", "LIGHT", "EARTH", "WATER", "FIRE", "WIND", "DIVINE"];

function CardBadges({ card }: { card: Card }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {card.frame_type && (
        <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[11px] font-bold text-purple-700">
          {card.frame_type}
        </span>
      )}

      {card.type && (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-700">
          {card.type}
        </span>
      )}

      {card.race && (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-700">
          {card.race}
        </span>
      )}

      {card.attribute && (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-700">
          {card.attribute}
        </span>
      )}

      {card.archetype && (
        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-bold text-blue-700">
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

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Card[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [typeFilter, setTypeFilter] = useState("all");
  const [raceFilter, setRaceFilter] = useState("all");
  const [attributeFilter, setAttributeFilter] = useState("all");
  const [archetypeFilter, setArchetypeFilter] = useState("");
  const [minAtk, setMinAtk] = useState("");
  const [maxAtk, setMaxAtk] = useState("");
  const [minDef, setMinDef] = useState("");
  const [maxDef, setMaxDef] = useState("");
  const [minLevel, setMinLevel] = useState("");
  const [maxLevel, setMaxLevel] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadDeck() {
    const response = await fetch(`/api/decks/${deckId}`, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(
        `Deck request failed: ${response.status} ${await response.text()}`
      );
    }

    const data = await response.json();
    const validDeckCards = Array.isArray(data.deck_cards)
      ? data.deck_cards.filter(isDeckCard)
      : [];

    if (Array.isArray(data.deck_cards) && validDeckCards.length !== data.deck_cards.length) {
      console.warn(
        "Ignored malformed deck cards:",
        data.deck_cards.filter((item: unknown) => !isDeckCard(item))
      );
    }

    const normalizedDeck: Deck = {
      id: String(data.id),
      name: String(data.name),
      created_at: String(data.created_at ?? ""),
      deck_cards: validDeckCards,
    };

    setDeck(normalizedDeck);
    setDeckName(normalizedDeck.name);
  }

  async function loadCollection() {
    const response = await fetch("/api/collection", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(
        `Collection request failed: ${response.status} ${await response.text()}`
      );
    }

    const data: unknown = await response.json();
    setCollection(Array.isArray(data) ? data.filter(isCollectionItem) : []);
  }

  async function loadDeckUsage() {
    try {
      const response = await fetch(
        `/api/deck-usage?excludeDeckId=${encodeURIComponent(deckId)}`
      );

      if (!response.ok) {
        throw new Error(
          `Deck usage request failed: ${response.status} ${await response.text()}`
        );
      }

      const data: unknown = await response.json();
      setDeckUsage(Array.isArray(data) ? data.filter(isDeckUsageEntry) : []);
    } catch {
      setDeckUsage([]);
    }
  }

  async function reloadDeckData() {
    try {
      await Promise.all([loadDeck(), loadCollection(), loadDeckUsage()]);
      setError("");
    } catch (reloadError) {
      console.error(reloadError);
      setError(
        reloadError instanceof Error
          ? reloadError.message
          : "Could not load deck"
      );
    }
  }

  useEffect(() => {
    reloadDeckData();
  }, [deckId]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const params = new URLSearchParams();
      const trimmed = query.trim();

      if (trimmed.length >= 2) {
        params.set("q", trimmed);
      }

      if (typeFilter !== "all") params.set("type", typeFilter);
      if (raceFilter !== "all") params.set("race", raceFilter);
      if (attributeFilter !== "all") params.set("attribute", attributeFilter);
      if (archetypeFilter.trim()) params.set("archetype", archetypeFilter.trim());

      if (minAtk) params.set("minAtk", minAtk);
      if (maxAtk) params.set("maxAtk", maxAtk);
      if (minDef) params.set("minDef", minDef);
      if (maxDef) params.set("maxDef", maxDef);
      if (minLevel) params.set("minLevel", minLevel);
      if (maxLevel) params.set("maxLevel", maxLevel);

      if (params.toString() === "") {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch(`/api/cards/search?${params.toString()}`);

        if (!response.ok) {
          throw new Error(
            `Card search failed: ${response.status} ${await response.text()}`
          );
        }

        const data: unknown = await response.json();
        setSuggestions(Array.isArray(data) ? data.filter(isCard) : []);
      } catch (searchError) {
        console.error(searchError);
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [
    query,
    typeFilter,
    raceFilter,
    attributeFilter,
    archetypeFilter,
    minAtk,
    maxAtk,
    minDef,
    maxDef,
    minLevel,
    maxLevel,
  ]);

  const deckCards = deck?.deck_cards ?? [];

  const groupedCards = useMemo(() => {
    const sortByName = (cards: DeckCard[]) =>
      [...cards]
        .filter((item) => item?.card)
        .sort((a, b) => a.card.name.localeCompare(b.card.name));

    return {
      main: sortByName(deckCards.filter((item) => item.section === "main")),
      extra: sortByName(deckCards.filter((item) => item.section === "extra")),
      side: sortByName(deckCards.filter((item) => item.section === "side")),
    };
  }, [deckCards]);

  function getOwnedQuantity(cardId: number) {
    const item = collection.find((entry) => entry.card_id === cardId);
    return item?.quantity_owned ?? 0;
  }

  function getTotalQuantityInCurrentDeck(cardId: number) {
    return deckCards
      .filter((item) => item.card.id === cardId)
      .reduce((total, item) => total + item.quantity, 0);
  }

  function getUsageElsewhere(cardId: number) {
    return deckUsage.find((entry) => entry.card_id === cardId) ?? null;
  }

  function getQuantityUsedElsewhere(cardId: number) {
    return getUsageElsewhere(cardId)?.quantity_used_elsewhere ?? 0;
  }

  function getOtherDecksText(cardId: number) {
    const usage = getUsageElsewhere(cardId);

    if (!usage || usage.decks.length === 0) {
      return "";
    }

    return usage.decks
      .map((deck) => `${deck.deck_name} x${deck.quantity}`)
      .join(", ");
  }

  function getGlobalMissing(cardId: number) {
    const owned = getOwnedQuantity(cardId);
    const usedHere = getTotalQuantityInCurrentDeck(cardId);
    const usedElsewhere = getQuantityUsedElsewhere(cardId);

    return Math.max(0, usedHere + usedElsewhere - owned);
  }

  function countSection(section: Section) {
    return deckCards
      .filter((item) => item.section === section)
      .reduce((total, item) => total + item.quantity, 0);
  }

  async function saveDeckName() {
    const name = deckName.trim();
    if (!name) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error(
          `Rename failed: ${response.status} ${await response.text()}`
        );
      }

      await reloadDeckData();
    } catch (renameError) {
      console.error(renameError);
      setError(
        renameError instanceof Error ? renameError.message : "Could not rename deck"
      );
    } finally {
      setLoading(false);
    }
  }

  async function addCardToDeck(card: Card, section: Section) {
    if (!deck) return;

    setLoading(true);

    try {
      const existing = deck.deck_cards.find(
        (item) => item.card.id === card.id && item.section === section
      );

      const response = existing
        ? await fetch(`/api/decks/cards/${existing.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              quantity: existing.quantity + 1,
            }),
          })
        : await fetch(`/api/decks/${deckId}/cards`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              card_id: card.id,
              quantity: 1,
              section,
            }),
          });

      if (!response.ok) {
        throw new Error(
          `Add card failed: ${response.status} ${await response.text()}`
        );
      }

      setSpotlightCard(card);
      await reloadDeckData();
    } catch (addError) {
      console.error(addError);
      setError(
        addError instanceof Error ? addError.message : "Could not add card"
      );
    } finally {
      setLoading(false);
    }
  }

  async function setDeckCardQuantity(deckCard: DeckCard, quantity: number) {
    setLoading(true);

    try {
      const response = await fetch(`/api/decks/cards/${deckCard.id}`, {
        method: quantity <= 0 ? "DELETE" : "PATCH",
        headers:
          quantity <= 0
            ? undefined
            : {
                "Content-Type": "application/json",
              },
        body:
          quantity <= 0
            ? undefined
            : JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        throw new Error(
          `Deck-card update failed: ${response.status} ${await response.text()}`
        );
      }

      await reloadDeckData();
    } catch (updateError) {
      console.error(updateError);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update deck card"
      );
    } finally {
      setLoading(false);
    }
  }

  async function removeDeckCard(deckCard: DeckCard) {
    setLoading(true);

    try {
      const response = await fetch(`/api/decks/cards/${deckCard.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          `Deck-card deletion failed: ${response.status} ${await response.text()}`
        );
      }

      await reloadDeckData();
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not remove deck card"
      );
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setQuery("");
    setTypeFilter("all");
    setRaceFilter("all");
    setAttributeFilter("all");
    setArchetypeFilter("");
    setMinAtk("");
    setMaxAtk("");
    setMinDef("");
    setMaxDef("");
    setMinLevel("");
    setMaxLevel("");
    setSuggestions([]);
  }

  function handleSearchCardLeftClick(card: Card) {
    setSpotlightCard(card);
  }

  function handleSearchCardRightClick(
    event: MouseEvent<HTMLDivElement>,
    card: Card
  ) {
    event.preventDefault();

    const section: Section = event.altKey ? "side" : getAutoSection(card);

    addCardToDeck(card, section);
  }

  function renderSpotlight() {
    const card = spotlightCard;

    if (!card) {
      return (
        <aside className="rounded-2xl border bg-white p-4 shadow-sm xl:sticky xl:top-5">
          <h2 className="text-xl font-black">Card Preview</h2>
          <p className="mt-3 text-sm text-slate-600">
            Left click a card to preview it here. Right click a search result to
            add it automatically.
          </p>

          <div className="mt-4 rounded-xl bg-slate-100 p-4 text-sm font-semibold text-slate-500">
            Right click = add to Main/Extra automatically.
            <br />
            Alt + right click = add to Side.
          </div>
        </aside>
      );
    }

    const owned = getOwnedQuantity(card.id);
    const usedHere = getTotalQuantityInCurrentDeck(card.id);
    const usedElsewhere = getQuantityUsedElsewhere(card.id);
    const missing = getGlobalMissing(card.id);
    const otherDecksText = getOtherDecksText(card.id);

    return (
      <aside className="rounded-2xl border bg-white p-4 shadow-sm xl:sticky xl:top-5 xl:max-h-[calc(100vh-40px)] xl:overflow-y-auto">
        <h2 className="mb-3 text-xl font-black">Card Preview</h2>

        {card.image_url ? (
          <img
            src={card.image_url}
            alt={card.name}
            className="mx-auto w-full max-w-[260px] rounded-xl object-cover shadow"
          />
        ) : (
          <div className="mx-auto aspect-[3/4.3] w-full max-w-[260px] rounded-xl bg-slate-200" />
        )}

        <div className="mt-4">
          <h3 className="text-2xl font-black leading-tight">{card.name}</h3>
          <CardBadges card={card} />
          <CardStats card={card} />

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-black">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
              Owned x{owned}
            </div>

            <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
              This deck x{usedHere}
            </div>

            <div className="rounded-xl bg-orange-50 p-3 text-orange-700">
              Other decks x{usedElsewhere}
            </div>

            <div
              className={`rounded-xl p-3 ${
                missing > 0
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              Missing x{missing}
            </div>
          </div>

          {otherDecksText && (
            <p className="mt-3 rounded-xl bg-orange-50 p-3 text-sm font-semibold text-orange-700">
              Used in: {otherDecksText}
            </p>
          )}

          {card.description && (
            <p className="mt-4 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
              {card.description}
            </p>
          )}
        </div>
      </aside>
    );
  }

  function renderCompactSection(title: string, section: Section, cards: DeckCard[]) {
    const total = countSection(section);

    return (
      <section className="rounded-2xl border bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black">{title}</h2>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">
            {total}
          </span>
        </div>

        {cards.length === 0 ? (
          <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-500">
            Empty.
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-7 lg:grid-cols-8 2xl:grid-cols-10">
            {cards.map((deckCard) => {
              const card = deckCard.card;
              const owned = getOwnedQuantity(card.id);
              const usedHere = getTotalQuantityInCurrentDeck(card.id);
              const usedElsewhere = getQuantityUsedElsewhere(card.id);
              const missing = getGlobalMissing(card.id);
              const otherDecksText = getOtherDecksText(card.id);

              return (
                <div
                  key={deckCard.id}
                  className={`group relative cursor-pointer rounded-lg border bg-slate-50 p-1 ${
                    missing > 0 ? "border-red-400" : "border-slate-200"
                  }`}
                  title={`${card.name} | This deck: ${usedHere} | Other decks: ${usedElsewhere} | Owned: ${owned} | Missing globally: ${missing}${
                    otherDecksText ? ` | Used in: ${otherDecksText}` : ""
                  }`}
                  onClick={() => setSpotlightCard(card)}
                >
                  <div className="relative">
                    {card.image_url ? (
                      <img
                        src={card.image_url}
                        alt={card.name}
                        className="aspect-[3/4.3] w-full rounded object-cover"
                      />
                    ) : (
                      <div className="aspect-[3/4.3] w-full rounded bg-slate-200" />
                    )}

                    <div className="absolute right-1 top-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-black text-white">
                      x{deckCard.quantity}
                    </div>

                    {missing > 0 && (
                      <div className="absolute bottom-1 left-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                        -{missing}
                      </div>
                    )}

                    {usedElsewhere > 0 && (
                      <div className="absolute bottom-1 right-1 rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                        O{usedElsewhere}
                      </div>
                    )}
                  </div>

                  <div className="mt-1 truncate text-[10px] font-bold text-slate-800">
                    {card.name}
                  </div>

                  <div className="mt-1 grid grid-cols-3 gap-1">
                    <button
                      className="rounded bg-white px-1 py-0.5 text-[11px] font-black shadow hover:bg-slate-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeckCardQuantity(deckCard, deckCard.quantity - 1);
                      }}
                      disabled={loading}
                    >
                      -
                    </button>

                    <button
                      className="rounded bg-white px-1 py-0.5 text-[11px] font-black shadow hover:bg-slate-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeckCardQuantity(deckCard, deckCard.quantity + 1);
                      }}
                      disabled={loading}
                    >
                      +
                    </button>

                    <button
                      className="rounded bg-red-50 px-1 py-0.5 text-[11px] font-black text-red-600 shadow hover:bg-red-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeDeckCard(deckCard);
                      }}
                      disabled={loading}
                    >
                      ×
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
      <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950">
        <div className="mx-auto max-w-7xl">
          <p
            className={`rounded-xl border p-5 shadow-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            {error || "Loading deck..."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-950">
      <div className="mx-auto max-w-[1800px]">
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <header className="mb-5 flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/decks"
              className="mb-2 inline-block text-sm font-bold text-blue-700 hover:underline"
            >
              ← Back to decks
            </Link>

            <h1 className="text-2xl font-black tracking-tight">{deck.name}</h1>

            <p className="mt-1 text-sm font-semibold text-slate-600">
              Main {countSection("main")} / Extra {countSection("extra")} / Side{" "}
              {countSection("side")}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="rounded-xl border border-slate-300 px-4 py-2 outline-none ring-blue-500 focus:ring-2"
              value={deckName}
              onChange={(event) => setDeckName(event.target.value)}
            />

            <button
              className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-700 disabled:opacity-50"
              onClick={saveDeckName}
              disabled={loading}
            >
              Rename
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_1fr_420px]">
          {renderSpotlight()}

          <div className="space-y-3">
            {renderCompactSection("Main Deck", "main", groupedCards.main)}
            {renderCompactSection("Extra Deck", "extra", groupedCards.extra)}
            {renderCompactSection("Side Deck", "side", groupedCards.side)}
          </div>

          <aside className="rounded-2xl border bg-white p-4 shadow-sm xl:sticky xl:top-5 xl:max-h-[calc(100vh-40px)] xl:overflow-y-auto">
            <div className="mb-4">
              <h2 className="text-xl font-black">Card Search</h2>
              <p className="mt-1 text-sm text-slate-600">
                Left click = preview. Right click = auto-add. Alt + right click =
                side deck.
              </p>
            </div>

            <input
              className="mb-3 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-blue-500 focus:ring-2"
              placeholder="Search card name..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />

            <button
              className="mb-3 w-full rounded-xl border border-slate-300 px-4 py-2 font-bold hover:bg-slate-100"
              onClick={() => setShowFilters((value) => !value)}
            >
              {showFilters ? "Hide filters" : "Show filters"}
            </button>

            {showFilters && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="grid grid-cols-1 gap-2">
                  <select
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                  >
                    <option value="all">All card types</option>
                    {CARD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <select
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    value={raceFilter}
                    onChange={(event) => setRaceFilter(event.target.value)}
                  >
                    <option value="all">All races/subtypes</option>
                    {RACES_AND_SUBTYPES.map((race) => (
                      <option key={race} value={race}>
                        {race}
                      </option>
                    ))}
                  </select>

                  <select
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    value={attributeFilter}
                    onChange={(event) => setAttributeFilter(event.target.value)}
                  >
                    <option value="all">All attributes</option>
                    {ATTRIBUTES.map((attribute) => (
                      <option key={attribute} value={attribute}>
                        {attribute}
                      </option>
                    ))}
                  </select>

                  <input
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="Archetype, e.g. D/D"
                    value={archetypeFilter}
                    onChange={(event) => setArchetypeFilter(event.target.value)}
                  />
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="Min ATK"
                    value={minAtk}
                    onChange={(event) => setMinAtk(event.target.value)}
                  />

                  <input
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="Max ATK"
                    value={maxAtk}
                    onChange={(event) => setMaxAtk(event.target.value)}
                  />

                  <input
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="Min DEF"
                    value={minDef}
                    onChange={(event) => setMinDef(event.target.value)}
                  />

                  <input
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="Max DEF"
                    value={maxDef}
                    onChange={(event) => setMaxDef(event.target.value)}
                  />

                  <input
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="Min Level"
                    value={minLevel}
                    onChange={(event) => setMinLevel(event.target.value)}
                  />

                  <input
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="Max Level"
                    value={maxLevel}
                    onChange={(event) => setMaxLevel(event.target.value)}
                  />
                </div>

                <button
                  className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-2 font-bold hover:bg-slate-100"
                  onClick={resetFilters}
                >
                  Reset filters
                </button>
              </div>
            )}

            <div className="space-y-2">
              {suggestions.length === 0 ? (
                <p className="rounded-xl bg-slate-100 p-4 text-sm text-slate-500">
                  Search by name or open filters to find cards.
                </p>
              ) : (
                suggestions.map((card) => {
                  const owned = getOwnedQuantity(card.id);
                  const alreadyInThisDeck = getTotalQuantityInCurrentDeck(card.id);
                  const usedElsewhere = getQuantityUsedElsewhere(card.id);
                  const autoSection = getAutoSection(card);
                  const neededAfterAdd = alreadyInThisDeck + usedElsewhere + 1;
                  const missingAfterAdd = Math.max(0, neededAfterAdd - owned);
                  const otherDecksText = getOtherDecksText(card.id);

                  return (
                    <div
                      key={card.id}
                      className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-2 hover:bg-slate-50"
                      onClick={() => handleSearchCardLeftClick(card)}
                      onContextMenu={(event) =>
                        handleSearchCardRightClick(event, card)
                      }
                      title="Left click: preview. Right click: add automatically. Alt + right click: side deck."
                    >
                      {card.image_url ? (
                        <img
                          src={card.image_url}
                          alt={card.name}
                          className="h-20 w-14 flex-shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="h-20 w-14 flex-shrink-0 rounded bg-slate-200" />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 text-sm font-black text-slate-950">
                          {card.name}
                        </div>

                        <CardBadges card={card} />
                        <CardStats card={card} />

                        <div className="mt-2 flex flex-wrap gap-1 text-[11px] font-black">
                          <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">
                            Owned x{owned}
                          </span>

                          <span className="rounded bg-purple-50 px-2 py-1 text-purple-700">
                            Auto: {autoSection.toUpperCase()}
                          </span>

                          {alreadyInThisDeck > 0 && (
                            <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
                              This deck x{alreadyInThisDeck}
                            </span>
                          )}

                          {usedElsewhere > 0 && (
                            <span
                              className="rounded bg-orange-50 px-2 py-1 text-orange-700"
                              title={otherDecksText}
                            >
                              Other decks x{usedElsewhere}
                            </span>
                          )}

                          {missingAfterAdd > 0 && (
                            <span className="rounded bg-red-50 px-2 py-1 text-red-700">
                              Missing after add x{missingAfterAdd}
                            </span>
                          )}
                        </div>

                        {otherDecksText && (
                          <div className="mt-1 truncate text-[11px] font-semibold text-orange-700">
                            Used in: {otherDecksText}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
