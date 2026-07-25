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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    setNewDeckName("");
    await loadDecks();

    setLoading(false);
  }

  async function deleteDeck(deckId: string) {
    const ok = window.confirm("Delete this deck?");

    if (!ok) return;

    setLoading(true);

    await fetch(`/api/decks/${deckId}`, {
      method: "DELETE",
    });

    await loadDecks();

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Decks</h1>
            <p className="mt-2 text-slate-600">
              Create decks, edit cards, and check what you are missing.
            </p>
          </div>

          <Link
            href="/collection"
            className="rounded-xl border border-slate-300 px-4 py-2 font-semibold hover:bg-slate-100"
          >
            Collection
          </Link>
        </header>

        <section className="mb-8 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-xl font-bold">Create a deck</h2>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none ring-blue-500 focus:ring-2"
              placeholder="Deck name, e.g. Blue-Eyes"
              value={newDeckName}
              onChange={(event) => setNewDeckName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  createDeck();
                }
              }}
            />

            <button
              className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              onClick={createDeck}
              disabled={loading}
            >
              Create
            </button>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Deck list</h2>

          {decks.length === 0 ? (
            <p className="rounded-xl bg-slate-100 p-4 text-slate-600">
              No decks yet.
            </p>
          ) : (
            <div className="space-y-3">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-xl font-black">{deck.name}</div>
                    <div className="text-sm text-slate-500">
                      Created {new Date(deck.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/decks/${deck.id}`}
                      className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-700"
                    >
                      Edit
                    </Link>

                    <button
                      className="rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-600 hover:bg-red-50"
                      onClick={() => deleteDeck(deck.id)}
                      disabled={loading}
                    >
                      Delete
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
