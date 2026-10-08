"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, formatDate, type Book, type Category } from "@/lib/api";
import { CoverThumb, ErrorBanner, PageHeader, Stars, StatusPill, Tag } from "@/components/ui";

const PAGE_SIZE = 20;

export default function BooksPage() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("updated");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .books({ q, status, category, sort, page, pageSize: PAGE_SIZE })
        .then((res) => {
          setBooks(res.items);
          setTotal(res.total);
          setError(null);
        })
        .catch((e) => setError(e.message));
    }, 200);
    return () => clearTimeout(t);
  }, [q, status, category, sort, page]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="Books"
        subtitle={`${total} book${total === 1 ? "" : "s"} in the library`}
        actions={<Link href="/books/new" className="btn-primary">Upload book</Link>}
      />
      <ErrorBanner message={error} />

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <input
          className="input max-w-xs"
          placeholder="Search title, author, genre…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
        />
        <div className="flex rounded-full bg-cream-100 p-1 text-sm">
          {[["", "All"], ["published", "Published"], ["draft", "Drafts"]].map(([v, l]) => (
            <button
              key={v}
              onClick={() => { setStatus(v); setPage(1); }}
              className={`rounded-full px-4 py-1.5 font-medium ${status === v ? "bg-forest-800 text-white" : "text-muted hover:text-ink"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <select className="input w-auto" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select className="input ml-auto w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="updated">Recently updated</option>
          <option value="new">Newest published</option>
          <option value="popular">Most opened</option>
          <option value="rating">Highest rated</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-cream-200 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Book</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Rating</th>
              <th className="px-4 py-3 font-semibold">Flags</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {books === null && !error && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
            )}
            {books?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No books match these filters.</td></tr>
            )}
            {books?.map((b) => (
              <tr key={b.id} className="hover:bg-cream-50">
                <td className="px-4 py-3">
                  <Link href={`/books/${b.id}`} className="flex items-center gap-3">
                    <CoverThumb src={b.thumbUrl} title={b.title} />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink">{b.title}</span>
                      <span className="block truncate text-muted">{b.author || "Unknown author"}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {b.category?.name ?? <span className="text-muted">—</span>}
                  {b.genreTag && <span className="block text-xs text-muted">{b.genreTag}</span>}
                </td>
                <td className="px-4 py-3">
                  <Stars value={b.rating} /> <span className="ml-1 text-xs text-muted">{b.rating.toFixed(1)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {b.isFree && <Tag>Free</Tag>}
                    {b.isTrending && <Tag>Trending today</Tag>}
                    {b.isStaffPick && <Tag>Staff pick</Tag>}
                    {b.isBookOfTheDay && <Tag>Book of the day</Tag>}
                  </div>
                </td>
                <td className="px-4 py-3"><StatusPill status={b.status} /></td>
                <td className="px-4 py-3 text-muted">{formatDate(b.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <button className="btn-secondary px-4 py-1.5" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="px-2 text-muted">Page {page} of {pages}</span>
          <button className="btn-secondary px-4 py-1.5" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </>
  );
}
