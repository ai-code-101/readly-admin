"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { api, formatBytes, READER_URL, type Book, type BookInput, type Category, type EpubInfo } from "@/lib/api";
import { CoverThumb, ErrorBanner, Spinner, Stars } from "./ui";

const EMPTY: BookInput = {
  title: "",
  author: "",
  synopsis: "",
  language: "en",
  genreTag: "",
  categoryId: null,
  rating: 0,
  pageCount: 0,
  isFree: false,
  isTrending: false,
  isStaffPick: false,
  isBookOfTheDay: false,
  status: "draft",
};

function toInput(b: Book): BookInput {
  return {
    title: b.title,
    author: b.author,
    synopsis: b.synopsis,
    language: b.language,
    genreTag: b.genreTag,
    categoryId: b.category?.id ?? null,
    rating: b.rating,
    pageCount: b.pageCount,
    isFree: b.isFree,
    isTrending: b.isTrending,
    isStaffPick: b.isStaffPick,
    isBookOfTheDay: b.isBookOfTheDay,
    status: b.status,
  };
}

/** Upload (book === undefined) or edit an existing book. */
export function BookForm({ book: initial }: { book?: Book }) {
  const router = useRouter();
  const editing = !!initial;
  const [book, setBook] = useState<Book | undefined>(initial);
  const [form, setForm] = useState<BookInput>(initial ? toInput(initial) : EMPTY);
  const [categories, setCategories] = useState<Category[]>([]);

  const [epubFile, setEpubFile] = useState<File | null>(null);
  const [epubInfo, setEpubInfo] = useState<EpubInfo | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api.categories().then(setCategories).catch((e) => setError(e.message));
  }, []);

  // Object URL for previewing a not-yet-uploaded cover; the old one is revoked on change.
  function pickCoverFile(file: File | null) {
    setCoverFile(file);
    setCoverPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  const set = <K extends keyof BookInput>(key: K, value: BookInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function chooseEpub(file: File) {
    setError(null);
    setNotice(null);
    setBusy("Reading EPUB…");
    try {
      const info = await api.inspectEpub(file);
      if (editing && book) {
        const updated = await api.replaceEpub(book.id, file);
        setBook(updated);
        setNotice(`EPUB replaced (${formatBytes(file.size)}, ~${info.pageCount} pages).`);
        return;
      }
      setEpubFile(file);
      setEpubInfo(info);
      // Pre-fill anything the admin hasn't typed yet.
      setForm((f) => ({
        ...f,
        title: f.title || info.title,
        author: f.author || info.author,
        synopsis: f.synopsis || info.description,
        language: f.language && f.language !== "en" ? f.language : info.language || "en",
        pageCount: f.pageCount || info.pageCount,
      }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function chooseCover(file: File) {
    setError(null);
    setNotice(null);
    if (editing && book) {
      setBusy("Uploading cover…");
      try {
        setBook(await api.replaceCover(book.id, file));
        setNotice("Cover updated.");
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(null);
      }
    } else {
      pickCoverFile(file);
    }
  }

  async function save(status: BookInput["status"]) {
    setError(null);
    setNotice(null);
    const input = { ...form, status };
    if (!editing && !epubFile) return setError("Choose an EPUB file first.");
    if (!input.title.trim()) return setError("Title is required.");
    setBusy(status === "published" ? "Publishing…" : "Saving…");
    try {
      if (editing && book) {
        const updated = await api.updateBook(book.id, input);
        setBook(updated);
        setForm(toInput(updated));
        setNotice(status === "published" ? "Saved and published." : "Saved as draft.");
      } else {
        const created = await api.createBook(input, epubFile!, coverFile);
        router.push(`/books/${created.id}?created=1`);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!book || !confirm(`Delete “${book.title}” and its files? This cannot be undone.`)) return;
    setBusy("Deleting…");
    try {
      await api.deleteBook(book.id);
      router.push("/books");
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  const coverSrc = coverPreview ?? book?.coverUrl;
  const noCoverNote = !editing && !coverFile ? (epubInfo?.hasCover ? "The EPUB's own cover will be used." : epubInfo ? "This EPUB has no cover — upload one." : "") : "";

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      {/* Files column */}
      <div className="space-y-6">
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">Book file (EPUB)</h2>
          {editing && book ? (
            <p className="mb-3 text-sm text-muted">
              Current file: {formatBytes(book.epubSize)} · {book.wordCount.toLocaleString()} words
            </p>
          ) : epubFile && epubInfo ? (
            <div className="mb-3 rounded-xl bg-forest-50 p-3 text-sm">
              <p className="truncate font-semibold text-forest-800">{epubFile.name}</p>
              <p className="text-muted">
                {formatBytes(epubFile.size)} · {epubInfo.chapters} sections · {epubInfo.wordCount.toLocaleString()} words
              </p>
            </div>
          ) : null}
          <DropZone
            accept=".epub,application/epub+zip"
            label={editing ? "Replace EPUB" : epubFile ? "Choose a different EPUB" : "Drop an EPUB here or click to browse"}
            onFile={chooseEpub}
            disabled={!!busy}
          />
        </section>

        <section className="card p-5">
          <h2 className="mb-3 font-semibold">Cover image</h2>
          <div className="mb-3 flex justify-center">
            <CoverThumb src={coverSrc || undefined} title={form.title || "No cover"} className="h-64 w-44" />
          </div>
          {noCoverNote && <p className="mb-3 text-center text-xs text-muted">{noCoverNote}</p>}
          <DropZone
            accept="image/jpeg,image/png,image/webp,image/gif"
            label={coverSrc ? "Replace cover" : "Upload cover (JPG, PNG, WebP)"}
            onFile={chooseCover}
            disabled={!!busy}
            compact
          />
          {coverFile && !editing && (
            <button className="mt-2 w-full text-xs text-muted underline" onClick={() => pickCoverFile(null)}>
              Remove uploaded cover
            </button>
          )}
        </section>

        {editing && book && (
          <section className="card space-y-3 p-5 text-sm">
            <h2 className="font-semibold">Links</h2>
            {book.status === "published" ? (
              <a className="btn-secondary w-full" href={`${READER_URL}/books/${book.slug}`} target="_blank" rel="noreferrer">
                View on reader site ↗
              </a>
            ) : (
              <p className="text-muted">Publish the book to make it visible on the reader site.</p>
            )}
            <a className="block text-center text-forest-700 underline" href={book.epubUrl} download>
              Download EPUB
            </a>
            <button className="btn-danger w-full" onClick={remove} disabled={!!busy}>
              Delete book
            </button>
          </section>
        )}
      </div>

      {/* Metadata column */}
      <section className="card p-6">
        <ErrorBanner message={error} />
        {notice && (
          <div className="mb-6 rounded-xl border border-forest-100 bg-forest-50 px-4 py-3 text-sm text-forest-800">{notice}</div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Title *" className="md:col-span-2">
            <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Author">
            <input className="input" value={form.author} onChange={(e) => set("author", e.target.value)} />
          </Field>
          <Field label="Category">
            <select
              className="input"
              value={form.categoryId ?? ""}
              onChange={(e) => set("categoryId", e.target.value || null)}
            >
              <option value="">— Uncategorised —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Genre tag" hint="The small label on book cards, e.g. “Literary Fiction”.">
            <input className="input" value={form.genreTag} onChange={(e) => set("genreTag", e.target.value)} />
          </Field>
          <Field label="Rating" hint="Shown on book cards and the detail page (0–5).">
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                className="input w-24"
                value={form.rating}
                onChange={(e) => set("rating", Math.max(0, Math.min(5, Number(e.target.value) || 0)))}
              />
              <Stars value={form.rating} size={20} />
            </div>
          </Field>
          <Field label="Pages" hint={epubInfo ? `Estimated from the EPUB: ${epubInfo.pageCount}` : "Shown as “Page X of Y” in the reader."}>
            <input
              type="number"
              min={0}
              className="input"
              value={form.pageCount}
              onChange={(e) => set("pageCount", Math.max(0, Math.round(Number(e.target.value) || 0)))}
            />
          </Field>
          <Field label="Language" hint="Language code, e.g. en, sw.">
            <input className="input" value={form.language} onChange={(e) => set("language", e.target.value)} />
          </Field>
          <Field label="Synopsis" className="md:col-span-2">
            <textarea
              className="input min-h-40 leading-relaxed"
              value={form.synopsis}
              onChange={(e) => set("synopsis", e.target.value)}
            />
          </Field>
        </div>

        <fieldset className="mt-6">
          <legend className="label">Features</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle checked={form.isFree} onChange={(v) => set("isFree", v)} title="Free book" desc="Readable without a subscription." />
            <Toggle checked={form.isTrending} onChange={(v) => set("isTrending", v)} title="Trending" desc="Appears in “Trending Now”." />
            <Toggle checked={form.isStaffPick} onChange={(v) => set("isStaffPick", v)} title="Staff pick" desc="Featured in Staff Picks." />
            <Toggle checked={form.isBookOfTheDay} onChange={(v) => set("isBookOfTheDay", v)} title="Book of the day" desc="Hero spot on the home page (only one at a time)." />
          </div>
        </fieldset>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-cream-200 pt-6">
          <button className="btn-primary" disabled={!!busy} onClick={() => save("published")}>
            {busy && busy !== "Saving…" ? <Spinner /> : null}
            {editing && form.status === "published" ? "Save changes" : "Publish"}
          </button>
          <button className="btn-secondary" disabled={!!busy} onClick={() => save("draft")}>
            {busy === "Saving…" ? <Spinner /> : null}
            {editing && form.status === "published" ? "Unpublish (save as draft)" : "Save as draft"}
          </button>
          {busy && <span className="text-sm text-muted">{busy}</span>}
          <Link href="/books" className="ml-auto text-sm text-muted hover:text-ink">Cancel</Link>
        </div>
      </section>
    </div>
  );
}

function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="hint block">{hint}</span>}
    </label>
  );
}

function Toggle({ checked, onChange, title, desc }: { checked: boolean; onChange: (v: boolean) => void; title: string; desc: string }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${checked ? "border-forest-700 bg-forest-50" : "border-cream-200 hover:bg-cream-50"}`}>
      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-forest-800" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted">{desc}</span>
      </span>
    </label>
  );
}

function DropZone({
  accept,
  label,
  onFile,
  disabled,
  compact,
}: {
  accept: string;
  label: string;
  onFile: (f: File) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && ref.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f && !disabled) onFile(f);
      }}
      className={`grid cursor-pointer place-items-center rounded-xl border-2 border-dashed text-center text-sm transition ${
        compact ? "px-3 py-3" : "px-4 py-8"
      } ${over ? "border-forest-700 bg-forest-50" : "border-cream-200 text-muted hover:border-forest-700/50 hover:bg-cream-50"} ${
        disabled ? "pointer-events-none opacity-60" : ""
      }`}
    >
      {!compact && (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mb-2 text-forest-700" aria-hidden>
          <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <span className="font-medium">{label}</span>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
