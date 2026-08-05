"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/collection",
    label: "Collection",
    description: "Owned Cards & Vault",
    icon: "🎴",
  },
  {
    href: "/decks",
    label: "Decks",
    description: "Deck Builder & Lists",
    icon: "⚔️",
  },
  {
    href: "/needed",
    label: "Needed",
    description: "Missing Cards & Wishlist",
    icon: "💎",
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/decks") {
    return pathname === "/decks" || pathname.startsWith("/decks/");
  }
  return pathname === href;
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-800/80 bg-[#0c101d]/90 backdrop-blur-md p-5 flex flex-col justify-between shadow-2xl z-40 lg:block">
      <div>
        {/* Header Logo */}
        <div className="mb-8 pb-4 border-b border-slate-800/80">
          <Link href="/collection" className="group block">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition">
                <div className="h-full w-full bg-[#0c101d] rounded-[10px] flex items-center justify-center font-black text-amber-400 text-lg">
                  YGO
                </div>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
                  MASTER DECK
                </h1>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Manager & Vault
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="space-y-2.5">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative block rounded-xl p-3.5 transition-all duration-200 group ${
                  active
                    ? "bg-gradient-to-r from-amber-500/20 to-transparent border border-amber-500/40 text-amber-200 shadow-lg shadow-amber-500/10"
                    : "bg-slate-900/40 border border-slate-800/50 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700/80 hover:text-slate-100"
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-gradient-to-b from-amber-400 to-amber-600 rounded-r-full shadow-[0_0_10px_#f59e0b]" />
                )}
                <div className="flex items-center gap-3.5">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <div className="font-bold text-sm tracking-wide">{item.label}</div>
                    <div
                      className={`text-xs ${
                        active ? "text-amber-300/70" : "text-slate-500 group-hover:text-slate-400"
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer shortcut tips */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5 text-xs text-slate-400">
        <div className="font-bold text-amber-400/90 flex items-center gap-1.5 mb-1.5">
          <span>⚡</span> Controls & Shortcuts
        </div>
        <ul className="space-y-1 text-[11px] leading-relaxed text-slate-400">
          <li><span className="text-slate-200 font-semibold">Left Click:</span> Preview Card</li>
          <li><span className="text-slate-200 font-semibold">Right Click:</span> Quick Add (Auto Main/Extra)</li>
          <li><span className="text-slate-200 font-semibold">Alt + Right Click:</span> Add to Side Deck</li>
        </ul>
      </div>
    </aside>
  );
}
