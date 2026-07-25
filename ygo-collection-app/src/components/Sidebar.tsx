"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/collection",
    label: "Collection",
    description: "Owned cards",
  },
  {
    href: "/decks",
    label: "Decks",
    description: "Deck builder",
  },
  {
    href: "/needed",
    label: "Needed",
    description: "Missing cards",
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
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white p-4 shadow-sm lg:block">
      <div className="mb-8">
        <Link href="/collection" className="block">
          <h1 className="text-2xl font-black tracking-tight text-slate-950">
            YGO Manager
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Collection & decks
          </p>
        </Link>
      </div>

      <nav className="space-y-2">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-2xl px-4 py-3 transition ${
                active
                  ? "bg-blue-600 text-white shadow"
                  : "bg-slate-50 text-slate-800 hover:bg-slate-100"
              }`}
            >
              <div className="font-black">{item.label}</div>
              <div
                className={`text-xs font-semibold ${
                  active ? "text-blue-100" : "text-slate-500"
                }`}
              >
                {item.description}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <div className="font-black text-slate-800">Shortcuts</div>
        <p className="mt-2">
          In deck editor: left click previews, right click adds, Alt + right
          click adds to side.
        </p>
      </div>
    </aside>
  );
}
