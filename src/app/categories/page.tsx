"use client";

import { useEffect, useRef, useState } from "react";
import { api, type Category } from "@/lib/api";
import { ErrorBanner, PageHeader, Spinner } from "@/components/ui";

type Draft = { name: string; description: string; sortOrder: number };

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = () => api.categories().then(setCats).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const nextOrder = cats && cats.length ? Math.max(...cats.map((c) => c.sortOrder)) + 10 : 10;

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Genres shown in the reader’s navigation, category pages and home page. Lower order shows first."
        actions={!adding && <button className="btn-primary" onClick={() => setAdding(true)}>New category</button>}
      />
      <ErrorBanner message={error} />

      {adding && (
        <CategoryEditor
          initial={{ name: "", description: "", sortOrder: nextOrder }}
          onCancel={() => setAdding(false)}
          onSave={async (d) => {
            await api.createCategory(d);
            setAdding(false);
            await load();
          }}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {cats === null && !error && <p className="text-muted">Loading…</p>}
        {cats?.length === 0 && <p className="text-muted">No categories yet.</p>}
        {cats?.map((c) => (
          <CategoryCard key={c.id} cat={c} onChange={load} onError={setError} />
        ))}
      </div>
    </>
  );
}

function CategoryCard({ cat, onChange, onError }: { cat: Category; onChange: () => void; onError: (m: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (editing) {
    return (
      <CategoryEditor
        initial={{ name: cat.name, description: cat.description, sortOrder: cat.sortOrder }}
        onCancel={() => setEditing(false)}
        onSave={async (d) => {
          await api.updateCategory(cat.id, d);
          setEditing(false);
          onChange();
        }}
      />
    );
  }

  async function uploadImage(f: File) {
    setBusy(true);
    try {
      await api.setCategoryImage(cat.id, f);
      onChange();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete “${cat.name}”? Its ${cat.bookCount} book(s) will become uncategorised.`)) return;
    try {
      await api.deleteCategory(cat.id);
      onChange();
    } catch (e) {
      onError((e as Error).message);
    }
  }

  return (
    <article className="card overflow-hidden">
      <button
        className="group relative block h-36 w-full bg-forest-800"
        onClick={() => fileRef.current?.click()}
        title="Upload category image"
      >
        {cat.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cat.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full place-items-center font-display text-3xl text-white/90">{cat.name}</span>
        )}
        <span className="absolute inset-0 grid place-items-center bg-black/40 text-sm font-semibold text-white opacity-0 transition group-hover:opacity-100">
          {busy ? <Spinner /> : cat.imageUrl ? "Replace image" : "Upload image"}
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadImage(f);
            e.target.value = "";
          }}
        />
      </button>
      <div className="p-5">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h2 className="font-display text-2xl text-forest-800">{cat.name}</h2>
          <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs text-muted">#{cat.sortOrder}</span>
        </div>
        <p className="mb-1 text-xs text-muted">/{cat.slug} · {cat.bookCount} published book{cat.bookCount === 1 ? "" : "s"}</p>
        <p className="line-clamp-3 min-h-[3.75rem] text-sm text-muted">{cat.description || "No description."}</p>
        <div className="mt-4 flex gap-2">
          <button className="btn-secondary px-4 py-1.5" onClick={() => setEditing(true)}>Edit</button>
          <button className="btn-danger px-4 py-1.5" onClick={remove}>Delete</button>
        </div>
      </div>
    </article>
  );
}

function CategoryEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: Draft;
  onSave: (d: Draft) => Promise<void>;
  onCancel: () => void;
}) {
  const [d, setD] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="card mb-4 space-y-4 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!d.name.trim()) return setError("Name is required.");
        setBusy(true);
        setError(null);
        try {
          await onSave(d);
        } catch (err) {
          setError((err as Error).message);
          setBusy(false);
        }
      }}
    >
      <ErrorBanner message={error} />
      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <label>
          <span className="label">Name *</span>
          <input className="input" autoFocus value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
        </label>
        <label>
          <span className="label">Order</span>
          <input
            type="number"
            className="input"
            value={d.sortOrder}
            onChange={(e) => setD({ ...d, sortOrder: Math.round(Number(e.target.value) || 0) })}
          />
        </label>
      </div>
      <label className="block">
        <span className="label">Description</span>
        <textarea className="input min-h-24" value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} />
      </label>
      <div className="flex gap-2">
        <button className="btn-primary" disabled={busy}>{busy && <Spinner />}Save</button>
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </form>
  );
}
