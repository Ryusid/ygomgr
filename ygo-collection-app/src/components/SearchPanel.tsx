"use client";

import { useState } from "react";

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

export type FilterState = {
  query: string;
  type: string;
  race: string;
  attribute: string;
  archetype: string;
  minAtk: string;
  maxAtk: string;
  minDef: string;
  maxDef: string;
  minLevel: string;
  maxLevel: string;
};

type SearchPanelProps = {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  placeholder?: string;
  compact?: boolean;
};

export default function SearchPanel({
  filters,
  onChange,
  onReset,
  placeholder = "Search by card name...",
  compact = false,
}: SearchPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  function updateFilter(key: keyof FilterState, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md">
      {/* Primary search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-2.5 pl-10 text-sm font-medium text-slate-100 placeholder-slate-500 outline-none ring-amber-500/50 focus:border-amber-500 focus:ring-2 transition"
            placeholder={placeholder}
            value={filters.query}
            onChange={(e) => updateFilter("query", e.target.value)}
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
            🔍
          </span>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition ${
            showAdvanced ||
            filters.type !== "all" ||
            filters.race !== "all" ||
            filters.attribute !== "all" ||
            filters.archetype !== ""
              ? "border-amber-500/60 bg-amber-500/10 text-amber-300"
              : "border-slate-700/80 bg-slate-800/60 text-slate-300 hover:bg-slate-800"
          }`}
        >
          <span>⚙️</span>
          <span>Filters</span>
        </button>

        {(filters.query ||
          filters.type !== "all" ||
          filters.race !== "all" ||
          filters.attribute !== "all" ||
          filters.archetype !== "" ||
          filters.minAtk ||
          filters.maxAtk ||
          filters.minLevel ||
          filters.maxLevel) && (
          <button
            onClick={onReset}
            className="rounded-xl border border-slate-700/80 bg-slate-800/60 px-3 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Reset Filters"
          >
            ✕
          </button>
        )}
      </div>

      {/* Advanced Filters dropdown */}
      {showAdvanced && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <select
              className="rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 text-slate-200 outline-none focus:border-amber-500"
              value={filters.type}
              onChange={(e) => updateFilter("type", e.target.value)}
            >
              <option value="all">All Card Types</option>
              {CARD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              className="rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 text-slate-200 outline-none focus:border-amber-500"
              value={filters.race}
              onChange={(e) => updateFilter("race", e.target.value)}
            >
              <option value="all">All Races / Subtypes</option>
              {RACES_AND_SUBTYPES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              className="rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 text-slate-200 outline-none focus:border-amber-500"
              value={filters.attribute}
              onChange={(e) => updateFilter("attribute", e.target.value)}
            >
              <option value="all">All Attributes</option>
              {ATTRIBUTES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Archetype (e.g. Blue-Eyes)"
              className="rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500"
              value={filters.archetype}
              onChange={(e) => updateFilter("archetype", e.target.value)}
            />
          </div>

          {!compact && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
              <input
                type="number"
                placeholder="Min ATK"
                className="rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500"
                value={filters.minAtk}
                onChange={(e) => updateFilter("minAtk", e.target.value)}
              />
              <input
                type="number"
                placeholder="Max ATK"
                className="rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500"
                value={filters.maxAtk}
                onChange={(e) => updateFilter("maxAtk", e.target.value)}
              />
              <input
                type="number"
                placeholder="Min DEF"
                className="rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500"
                value={filters.minDef}
                onChange={(e) => updateFilter("minDef", e.target.value)}
              />
              <input
                type="number"
                placeholder="Max DEF"
                className="rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500"
                value={filters.maxDef}
                onChange={(e) => updateFilter("maxDef", e.target.value)}
              />
              <input
                type="number"
                placeholder="Min Level"
                className="rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500"
                value={filters.minLevel}
                onChange={(e) => updateFilter("minLevel", e.target.value)}
              />
              <input
                type="number"
                placeholder="Max Level"
                className="rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500"
                value={filters.maxLevel}
                onChange={(e) => updateFilter("maxLevel", e.target.value)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
