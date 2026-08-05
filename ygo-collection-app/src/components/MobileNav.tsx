"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/collection", label: "Collection", icon: "🎴" },
  { href: "/decks", label: "Decks", icon: "⚔️" },
  { href: "/needed", label: "Needed", icon: "💎" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/decks") {
    return pathname === "/decks" || pathname.startsWith("/decks/");
  }
  return pathname === href;
}

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-50 border-b border-slate-800 bg-[#0c101d]/95 backdrop-blur-md p-3 lg:hidden shadow-lg">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-amber-600 to-yellow-300 p-0.5">
            <div className="h-full w-full bg-[#0c101d] rounded-[4px] flex items-center justify-center font-black text-amber-400 text-xs">
              YGO
            </div>
          </div>
          <span className="text-base font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
            MASTER DECK
          </span>
        </div>
      </div>

      <nav className="grid grid-cols-3 gap-2">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-center text-xs font-bold transition ${
                active
                  ? "bg-gradient-to-r from-amber-500/20 to-amber-600/30 border border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10"
                  : "bg-slate-900/60 border border-slate-800 text-slate-400"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
