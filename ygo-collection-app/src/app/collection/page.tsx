"use client";

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
    <div className="mt-2 flex flex-wrap gap-2">
      {card.type && (
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
          {card.type}
        </span>
      )}

      {card.race && (
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
          {card.race}
        </span>
      )}

      {card.attribute && (
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
          {card.attribute}
        </span>
      )}

      {card.archetype && (
        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
          {card.archetype}
        </span>
      )}
    </div>
  );
}

function CardStats({ card }: { card: Card }) {
  const hasMonsterStats =
    card.atk !== null ||
    card.def !== null ||
    card.level !== null ||
    card.linkval !== null ||
    card.scale !== null;

  if (!hasMonsterStats) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2 text-sm font-bold text-slate-700">
      {card.atk !== null && <span>ATK {card.atk}</span>}
      {card.def !== null && <span>DEF {card.def}</span>}
      {card.level !== null && <span>Level {card.level}</span>}
      {card.linkval !== null && <span>Link {card.linkval}</span>}
      {card.scale !== null && <span>Scale {card.scale}</span>}
    </div>
  );
}

export default function CollectionPage() {
  const [addQuery, setAddQuery] = useState("");
  const [collectionQuery, setCollectionQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Card[]>([]);
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("recent");

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

  async function loadCollection() {
    try {
      const response = await fetch("/api/collection", { cache: "no-store" });

      if (!response.ok) {
        throw new Error(
          `Collection request failed: ${response.status} ${await response.text()}`
        );
      }

      const data: unknown = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected collection response format");
      }

      const validItems = data.filter(isCollectionItem);

      if (validItems.length !== data.length) {
        console.warn(
          "Ignored malformed collection rows:",
          data.filter((item) => !isCollectionItem(item))
        );
      }

      setCollection(validItems);
      setError("");
    } catch (loadError) {
      console.error(loadError);
      setCollection([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load collection"
      );
    }
  }

  useEffect(() => {
    loadCollection();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const params = new URLSearchParams();
      const trimmed = addQuery.trim();

      if (trimmed.length >= 2) {
        params.set("q", trimmed);
      }

      if (typeFilter !== "all") {
        params.set("type", typeFilter);
      }

      if (raceFilter !== "all") {
        params.set("race", raceFilter);
      }

      if (attributeFilter !== "all") {
        params.set("attribute", attributeFilter);
      }

      if (archetypeFilter.trim()) {
        params.set("archetype", archetypeFilter.trim());
      }

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
    addQuery,
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

  async function setOwnedQuantity(card: Card, quantity: number) {
    setLoading(true);

    try {
      const response = await fetch("/api/collection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          card_id: card.id,
          quantity_owned: quantity,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Collection update failed: ${response.status} ${await response.text()}`
        );
      }

      await loadCollection();
    } catch (updateError) {
      console.error(updateError);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update collection"
      );
    } finally {
      setLoading(false);
    }
  }

  async function addOne(card: Card) {
    const currentOwned = getOwnedQuantity(card.id);
    await setOwnedQuantity(card, currentOwned + 1);
  }

  function getOwnedQuantity(cardId: number) {
    const item = collection.find((entry) => entry.card_id === cardId);
    return item?.quantity_owned ?? 0;
  }

  function resetAddFilters() {
    setAddQuery("");
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

  const totalUniqueCards = collection.length;

  const totalCopies = collection.reduce(
    (total, item) => total + item.quantity_owned,
    0
  );

  const filteredCollection = useMemo(() => {
    const query = collectionQuery.trim().toLowerCase();

    let items = collection;

    if (query.length > 0) {
      items = collection.filter((item) => {
        const card = item.card;

        const searchable = [
          card.name,
          card.type,
          card.description,
          card.race,
          card.attribute,
          card.archetype,
          card.atk?.toString(),
          card.def?.toString(),
          card.level?.toString(),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      });
    }

    return [...items].sort((a, b) => {
      if (sortMode === "name") {
        return a.card.name.localeCompare(b.card.name);
      }

      if (sortMode === "quantity") {
        return b.quantity_owned - a.quantity_owned;
      }

      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
  }, [collection, collectionQuery, sortMode]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Collection</h1>
          <p className="mt-2 text-slate-600">
            Search the full card database, add cards you own, and filter your
            collection.
          </p>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <section className="mb-8 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Add a card</h2>
              <p className="text-sm text-slate-600">
                Search by name, type, race/subtype, attribute, archetype, ATK,
                DEF, or level.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="rounded-xl bg-slate-100 px-4 py-2 text-center">
                <div className="text-xs font-medium text-slate-500">
                  Unique cards
                </div>
                <div className="text-lg font-bold">{totalUniqueCards}</div>
              </div>

              <div className="rounded-xl bg-slate-100 px-4 py-2 text-center">
                <div className="text-xs font-medium text-slate-500">
                  Total copies
                </div>
                <div className="text-lg font-bold">{totalCopies}</div>
              </div>
            </div>
          </div>

          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none ring-blue-500 focus:ring-2"
            placeholder="Search card name..."
            value={addQuery}
            onChange={(event) => setAddQuery(event.target.value)}
          />

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
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
              placeholder="Archetype, e.g. Blue-Eyes"
              value={archetypeFilter}
              onChange={(event) => setArchetypeFilter(event.target.value)}
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-6">
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
            className="mt-3 rounded-xl border border-slate-300 px-4 py-2 font-semibold hover:bg-slate-100"
            onClick={resetAddFilters}
          >
            Reset search filters
          </button>

          {suggestions.length > 0 && (
            <div className="mt-4 max-h-[600px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
              {suggestions.map((card) => {
                const owned = getOwnedQuantity(card.id);

                return (
                  <div
                    key={card.id}
                    className="flex items-start gap-4 border-b border-slate-100 p-4 last:border-b-0"
                  >
                    {card.image_url ? (
                      <img
                        src={card.image_url}
                        alt={card.name}
                        className="h-28 w-20 flex-shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="h-28 w-20 flex-shrink-0 rounded bg-slate-200" />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="text-xl font-black text-slate-950">
                        {card.name}
                      </div>

                      <CardBadges card={card} />
                      <CardStats card={card} />

                      {card.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                          {card.description}
                        </p>
                      )}

                      <div className="mt-3 text-lg font-black text-blue-700">
                        Owned: x{owned}
                      </div>
                    </div>

                    <button
                      className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                      onClick={() => addOne(card)}
                      disabled={loading}
                    >
                      + Add one
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold">Owned cards</h2>
              <p className="text-sm text-slate-600">
                Filter only inside cards you already added.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className="rounded-xl border border-slate-300 px-4 py-2 outline-none ring-blue-500 focus:ring-2"
                placeholder="Filter my collection..."
                value={collectionQuery}
                onChange={(event) => setCollectionQuery(event.target.value)}
              />

              <select
                className="rounded-xl border border-slate-300 px-4 py-2"
                value={sortMode}
                onChange={(event) =>
                  setSortMode(event.target.value as SortMode)
                }
              >
                <option value="recent">Sort: recently updated</option>
                <option value="name">Sort: name A-Z</option>
                <option value="quantity">Sort: highest quantity</option>
              </select>
            </div>
          </div>

          {collection.length === 0 ? (
            <p className="rounded-xl bg-slate-100 p-4 text-slate-600">
              No cards in collection yet.
            </p>
          ) : filteredCollection.length === 0 ? (
            <p className="rounded-xl bg-slate-100 p-4 text-slate-600">
              No owned cards match your filter.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredCollection.map((item) => (
                <div
                  key={item.card_id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    {item.card.image_url ? (
                      <img
                        src={item.card.image_url}
                        alt={item.card.name}
                        className="h-28 w-20 flex-shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="h-28 w-20 flex-shrink-0 rounded bg-slate-200" />
                    )}

                    <div className="min-w-0">
                      <div className="text-xl font-black text-slate-950">
                        {item.card.name}
                      </div>

                      <CardBadges card={item.card} />
                      <CardStats card={item.card} />

                      {item.card.description && (
                        <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-slate-600">
                          {item.card.description}
                        </p>
                      )}

                      <div className="mt-3 text-lg font-black text-blue-700">
                        Owned: x{item.quantity_owned}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <button
                      className="rounded-xl border border-slate-300 px-4 py-2 text-lg font-bold hover:bg-slate-100"
                      onClick={() =>
                        setOwnedQuantity(
                          item.card,
                          Math.max(0, item.quantity_owned - 1)
                        )
                      }
                      disabled={loading}
                    >
                      -
                    </button>

                    <span className="min-w-12 rounded-xl bg-slate-100 px-4 py-2 text-center text-xl font-black">
                      {item.quantity_owned}
                    </span>

                    <button
                      className="rounded-xl border border-slate-300 px-4 py-2 text-lg font-bold hover:bg-slate-100"
                      onClick={() =>
                        setOwnedQuantity(item.card, item.quantity_owned + 1)
                      }
                      disabled={loading}
                    >
                      +
                    </button>

                    <button
                      className="rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-600 hover:bg-red-50"
                      onClick={() => setOwnedQuantity(item.card, 0)}
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
