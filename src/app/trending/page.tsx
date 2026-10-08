"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, nairobiToday, type Book } from "@/lib/api";
import { CoverThumb, ErrorBanner, PageHeader, StatusPill } from "@/components/ui";

/** Pick the books shown in "What everyone is reading" for a given day. They drop off automatically the next day. */
export default function TrendingPage() {
  const today = nairobiToday();
  const [date, setDate] = useState(today);
  const [items, setItems] = useState<Book[] | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.trending(date).then((r) => setItems(r.items)).catch((e) => setError(e.message));
  }, [date]);
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!q.trim()) return;
    const t = setTimeout(() => api.books({ q, status: "published", pageSize: 8 }).then((r) => setResults(r.items)).catch(() => {}), 200);
    return () => clearTimeout(t);
  }, [q]);

  async function add(b: Book) {
    try {
      await api.setTrending(b.id, date);
      setQ("");
      setResults([]);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function remove(b: Book) {
    try {
      await api.removeTrending(b.id);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const onList = new Set(items?.map((b) => b.id));
  const label = date === today ? "today" : date;

  return (
    <>
      <PageHeader
        title="Trending"
        subtitle="Books shown in “What everyone is reading” on the platform home. Each pick lasts for its day only (Nairobi time) and drops off automatically the next day."
        actions={
          <div className="flex items-center gap-2">
            {date !== today && <button className="btn-secondary px-4 py-2" onClick={() => setDate(today)}>Today</button>}
            <input type="date" className="input w-auto" value={date} min={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
          </div>
        }
      />
      <ErrorBanner message={error} />

      <section className="card mb-6 p-5">
        <h2 className="mb-3 font-semibold">Add a book for {label}</h2>
        <input className="input" placeholder="Search published books by title or author…" value={q} onChange={(e) => setQ(e.target.value)} />
        {q.trim() && (
          <ul className="mt-3 divide-y divide-cream-200">
            {results.length === 0 && <li className="py-3 text-sm text-muted">No matches.</li>}
            {results.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-2.5">
                <CoverThumb src={b.thumbUrl} title={b.title} className="h-12 w-8" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{b.title}</span>
                  <span className="block truncate text-xs text-muted">{b.author}</span>
                </span>
                {onList.has(b.id) ? (
                  <span className="text-xs text-muted">Already trending</span>
                ) : (
                  <button className="btn-primary px-4 py-1.5" onClick={() => add(b)}>Add</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-1 font-semibold">Trending {label}</h2>
        <p className="mb-4 text-xs text-muted">If nothing is picked for a day, the platform shows the most-read books instead.</p>
        {items === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No books picked for {label} yet.</p>
        ) : (
          <ul className="divide-y divide-cream-200">
            {items.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-3">
                <CoverThumb src={b.thumbUrl} title={b.title} />
                <Link href={`/books/${b.id}`} className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{b.title}</span>
                  <span className="block truncate text-sm text-muted">{b.author} · {b.category?.name ?? "Uncategorised"}</span>
                </Link>
                <StatusPill status={b.status} />
                <button className="btn-danger px-4 py-1.5" onClick={() => remove(b)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
