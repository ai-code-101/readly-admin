"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Book } from "@/lib/api";
import { BookForm } from "@/components/book-form";
import { ErrorBanner, PageHeader, StatusPill } from "@/components/ui";

export function EditBook({ id, created }: { id: string; created: boolean }) {
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.book(id).then(setBook).catch((e) => setError(e.status === 404 ? "This book no longer exists." : e.message));
  }, [id]);

  return (
    <>
      <PageHeader
        title={book?.title ?? "Edit book"}
        subtitle={book ? `${book.author || "Unknown author"} · /books/${book.slug}` : undefined}
        actions={book ? <StatusPill status={book.status} /> : undefined}
      />
      <ErrorBanner message={error} />
      {error && <Link href="/books" className="btn-secondary">Back to books</Link>}
      {created && book && (
        <div className="mb-6 rounded-xl border border-forest-100 bg-forest-50 px-4 py-3 text-sm text-forest-800">
          “{book.title}” was uploaded{book.status === "published" ? " and published" : " as a draft"}.
        </div>
      )}
      {book && <BookForm key={book.id} book={book} />}
    </>
  );
}
