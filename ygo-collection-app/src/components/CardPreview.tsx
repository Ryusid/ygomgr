"use client";

import CardImage from "./CardImage";

export type Card = {
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

type CardPreviewProps = {
  card: Card | null;
  ownedQuantity?: number;
  deckQuantity?: number;
  usedElsewhereQuantity?: number;
  otherDecksText?: string;
  missingQuantity?: number;
};

export default function CardPreview({
  card,
  ownedQuantity = 0,
  deckQuantity = 0,
  usedElsewhereQuantity = 0,
  otherDecksText,
  missingQuantity = 0,
}: CardPreviewProps) {
  if (!card) {
    return (
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/50 text-3xl text-slate-500 mb-3 border border-slate-700/40">
          🔍
        </div>
        <h3 className="text-base font-bold text-slate-300">No Card Selected</h3>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
          Left-click any card in your collection or search results to preview details here.
        </p>
      </div>
    );
  }

  const hasStats =
    card.atk !== null ||
    card.def !== null ||
    card.level !== null ||
    card.linkval !== null ||
    card.scale !== null;

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-[#0d1222]/90 p-5 shadow-2xl backdrop-blur-md">
      {/* Card Image Display */}
      <div className="flex justify-center mb-4">
        <div className="w-52 shadow-2xl shadow-amber-500/5">
          <CardImage
            src={card.image_url}
            alt={card.name}
            frameType={card.frame_type}
            size="full"
          />
        </div>
      </div>

      {/* Name and Badges */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-black text-slate-100 tracking-wide leading-tight">
          {card.name}
        </h2>
        
        {card.archetype && (
          <p className="text-xs font-bold text-amber-400 mt-1 uppercase tracking-wider">
            {card.archetype}
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
          {card.attribute && (
            <span className="rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-bold text-amber-300">
              {card.attribute}
            </span>
          )}
          {card.race && (
            <span className="rounded-md bg-slate-800/80 border border-slate-700 px-2 py-0.5 text-[11px] font-bold text-slate-300">
              {card.race}
            </span>
          )}
          {card.type && (
            <span className="rounded-md bg-slate-800/80 border border-slate-700 px-2 py-0.5 text-[11px] font-bold text-slate-300">
              {card.type}
            </span>
          )}
        </div>

        {/* Stats Row */}
        {hasStats && (
          <div className="mt-3 flex items-center justify-center gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-xs font-black text-slate-200">
            {card.level !== null && (
              <span className="text-amber-400">★ {card.level}</span>
            )}
            {card.linkval !== null && (
              <span className="text-blue-400">LINK-{card.linkval}</span>
            )}
            {card.scale !== null && (
              <span className="text-purple-400">SCALE {card.scale}</span>
            )}
            {card.atk !== null && <span>ATK / {card.atk}</span>}
            {card.def !== null && <span>DEF / {card.def}</span>}
          </div>
        )}
      </div>

      {/* Inventory & Usage Counts */}
      <div className="grid grid-cols-2 gap-2 text-center text-xs font-black mb-4">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-emerald-300">
          <div className="text-[10px] text-emerald-400/80 uppercase tracking-wider font-bold">Owned</div>
          <div className="text-lg">x{ownedQuantity}</div>
        </div>

        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-2.5 text-blue-300">
          <div className="text-[10px] text-blue-400/80 uppercase tracking-wider font-bold">In Deck</div>
          <div className="text-lg">x{deckQuantity}</div>
        </div>

        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-2.5 text-purple-300">
          <div className="text-[10px] text-purple-400/80 uppercase tracking-wider font-bold">Other Decks</div>
          <div className="text-lg">x{usedElsewhereQuantity}</div>
        </div>

        <div
          className={`rounded-xl border p-2.5 ${
            missingQuantity > 0
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
              : "border-slate-800 bg-slate-900/40 text-slate-400"
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider font-bold opacity-80">Missing</div>
          <div className="text-lg">x{missingQuantity}</div>
        </div>
      </div>

      {otherDecksText && (
        <div className="mb-4 rounded-xl border border-purple-500/30 bg-purple-950/30 p-2.5 text-xs text-purple-300">
          <span className="font-bold">Decks using this:</span> {otherDecksText}
        </div>
      )}

      {/* Description */}
      {card.description && (
        <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-xs leading-relaxed text-slate-300">
          <p className="whitespace-pre-line">{card.description}</p>
        </div>
      )}
    </div>
  );
}
