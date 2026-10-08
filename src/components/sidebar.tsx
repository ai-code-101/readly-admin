"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { READER_URL } from "@/lib/api";

const NAV = [
  { href: "/", label: "Dashboard", icon: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" },
  { href: "/books", label: "Books", icon: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14zM20 17v4H6.5" },
  { href: "/categories", label: "Categories", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/trending", label: "Trending", icon: "M3 17l6-6 4 4 8-8M15 7h6v6" },
  { href: "/subscribers", label: "Subscribers", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
];

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <>
    <header className="fixed inset-x-0 top-0 z-20 flex items-center gap-4 overflow-x-auto bg-forest-800 px-4 py-3 text-white md:hidden">
      <Link href="/" className="shrink-0 text-white"><Logo /></Link>
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`shrink-0 rounded-full px-3 py-1 text-sm ${isActive(item.href) ? "bg-white text-forest-800" : "text-forest-50/90"}`}
        >
          {item.label}
        </Link>
      ))}
    </header>
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-forest-800 px-5 py-6 text-white md:flex">
      <Link href="/" className="mb-1 text-white">
        <Logo />
      </Link>
      <p className="mb-8 text-xs uppercase tracking-widest text-forest-100/60">Admin</p>
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-white text-forest-800" : "text-forest-50/90 hover:bg-white/10"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3">
        <Link href="/books/new" className="btn w-full bg-gold text-forest-950 hover:brightness-105">
          + Upload book
        </Link>
        <a href={READER_URL} target="_blank" rel="noreferrer" className="block text-center text-xs text-forest-100/70 hover:text-white">
          Open reader site ↗
        </a>
      </div>
    </aside>
    </>
  );
}
