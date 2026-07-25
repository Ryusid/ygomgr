"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/collection",
    label: "Collection",
  },
  {
    href: "/decks",
    label: "Decks",
  },
  {
    href: "/needed",
    label: "Needed",
  },
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
    <div className="sticky top-0 z-50 border-b border-slate-200 bg-white p-3 shadow-sm lg:hidden">
      <div className="mb-3 text-lg font-black">YGO Manager</div>

      <nav className="grid grid-cols-3 gap-2">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-3 py-2 text-center text-sm font-black ${
                active
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
