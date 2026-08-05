"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Deck = {
  id: string;
  name: string;
  created_at: string;
};

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [newDeckName, setNewDeckName] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadDecks() {
    const response = await fetch("/api/decks");
    const data = await response.json();
    if (Array.isArray(data)) {
      setDecks(data);
    } else {
      setDecks([]);
    }
  }

  useEffect(() => {
    loadDecks();
  }, []);

  async function createDeck() {
    const name = newDeckName.trim();
    if (!name) return;
    setLoading(true);

    await fetch("/api/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setNewDeckName("");
    await loadDecks();
    setLoading(false);
  }

  async function deleteDeck(deckId: string) {
    if (!confirm("Are you sure you want to delete this deck?")) return;
    setLoading(true);
    await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
    await loadDecks();
    setLoading(false);
  }

  return (
    <main className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-[#0f172a] via-[#131d35] to-[#0f172a] p-6 shadow-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚔️</span>
            <h1 className="text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500">
              DECK MANAGER
            </h1>
          </div>
          <p className="text-xs lg:text-sm text-slate-400 mt-1">
            Build, edit, and organize your competitive and casual Yu-Gi-Oh! decks.
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center min-w-28 shadow-lg shadow-amber-500/5">
          <div className="text-[10px] font-extrabold text-amber-400/80 uppercase tracking-widest">
            Total Decks
          </div>
          <div className="text-xl font-black text-amber-300">{decks.length}</div>
        </div>
      </div>

      {/* Create Deck Card */}
      <section className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md shadow-2xl">
        <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider mb-3">
          ✨ Construct New Deck
        </h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="flex-1 rounded-xl border border-slate-700/80 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-100 placeholder-slate-500 outline-none ring-amber-500/50 focus:border-amber-500 focus:ring-2 transition"
            placeholder="Enter deck name (e.g., Dragonmaid, Tearlaments...)"
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createDeck();
            }}
          />

          <button
            onClick={createDeck}
            disabled={loading || !newDeckName.trim()}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition disabled:opacity-50"
          >
            Create Deck
          </button>
        </div>
      </section>

      {/* Deck Grid */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider">
          Saved Decks ({decks.length})
        </h2>

        {decks.length === 0 ? (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-12 text-center text-slate-500">
            <div className="text-4xl mb-2">🃏</div>
            <div className="font-bold text-sm text-slate-400">No Decks Found</div>
            <p className="text-xs mt-1">Create your first deck above to start building.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck) => (
              <div
                key={deck.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md shadow-xl hover:border-amber-500/50 transition duration-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-black text-slate-100 group-hover:text-amber-300 transition">
                      {deck.name}
                    </h3>
                    <span className="text-lg">🎴</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Created {new Date(deck.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-2 pt-4 border-t border-slate-800/80">
                  <Link
                    href={`/decks/${deck.id}`}
                    className="flex-1 text-center rounded-xl bg-slate-800 border border-slate-700 py-2.5 text-xs font-bold text-slate-200 hover:bg-amber-500 hover:border-amber-400 hover:text-slate-950 transition shadow-md"
                  >
                    Edit Deck
                  </Link>

                  <button
                    onClick={() => deleteDeck(deck.id)}
                    disabled={loading}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition"
                    title="Delete Deck"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
