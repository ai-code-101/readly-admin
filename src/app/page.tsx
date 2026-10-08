"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, formatBytes, formatDate, type Book, type Stats } from "@/lib/api";
import { CoverThumb, ErrorBanner, PageHeader, StatusPill } from "@/components/ui";

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Book[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.stats(), api.books({ sort: "updated", pageSize: 6 })])
      .then(([s, b]) => {
        setStats(s);
        setRecent(b.items);
      })
      .catch((e) => setError(e.message));
  }, []);

  const tiles = stats
    ? [
        { label: "Active subscribers", value: stats.activeSubscribers, note: `${stats.subscriptionsToday} new subscription${stats.subscriptionsToday === 1 ? "" : "s"} today`, href: "/subscribers" },
        { label: "Readers", value: stats.users, note: "Verified phone numbers" },
        { label: "Books", value: stats.books, note: `${stats.publishedBooks} published · ${stats.draftBooks} drafts · ${stats.freeBooks} free` },
        { label: "Book opens", value: stats.totalOpens, note: `${stats.categories} categories · ${formatBytes(stats.storageBytes)} stored` },
      ]
    : [];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="An overview of the Readly library."
        actions={<Link href="/books/new" className="btn-primary">Upload book</Link>}
      />
      <ErrorBanner message={error} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(stats ? tiles : Array.from({ length: 4 }, () => null)).map((t, i) => (
          <div key={i} className="card p-5">
            {t ? (
              <>
                <p className="text-sm text-muted">{t.label}</p>
                <p className="mt-1 font-display text-4xl text-forest-800">{t.value.toLocaleString()}</p>
                <p className="mt-1 text-xs text-muted">{t.note}</p>
                {"href" in t && t.href && (
                  <Link href={t.href} className="mt-2 inline-block text-xs font-semibold text-forest-700 hover:underline">View subscribers →</Link>
                )}
              </>
            ) : (
              <div className="h-20 animate-pulse rounded-lg bg-cream-100" />
            )}
          </div>
        ))}
      </div>

      <section className="card mt-8 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-forest-800">Recently updated</h2>
          <Link href="/books" className="text-sm font-semibold text-forest-700 hover:underline">All books →</Link>
        </div>
        {recent.length === 0 && !error ? (
          <p className="py-8 text-center text-sm text-muted">
            No books yet. <Link href="/books/new" className="font-semibold text-forest-700 underline">Upload your first EPUB</Link>.
          </p>
        ) : (
          <ul className="divide-y divide-cream-200">
            {recent.map((b) => (
              <li key={b.id}>
                <Link href={`/books/${b.id}`} className="flex items-center gap-4 py-3 hover:bg-cream-50">
                  <CoverThumb src={b.thumbUrl} title={b.title} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{b.title}</p>
                    <p className="truncate text-sm text-muted">{b.author || "Unknown author"} · {b.category?.name ?? "Uncategorised"}</p>
                  </div>
                  <StatusPill status={b.status} />
                  <span className="hidden w-28 text-right text-xs text-muted sm:block">{formatDate(b.updatedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
