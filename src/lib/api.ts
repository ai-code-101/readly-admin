// Typed client for the admin endpoints of the Readly API (via the same-origin proxy).

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  bookCount: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type Book = {
  id: string;
  title: string;
  slug: string;
  author: string;
  synopsis: string;
  language: string;
  genreTag: string;
  category: { id: string; name: string; slug: string } | null;
  rating: number;
  pageCount: number;
  wordCount: number;
  isFree: boolean;
  isTrending: boolean;
  isStaffPick: boolean;
  isBookOfTheDay: boolean;
  status: "draft" | "published";
  openCount: number;
  hasEpub: boolean;
  epubSize: number;
  coverUrl: string;
  thumbUrl: string;
  epubUrl: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookInput = {
  title: string;
  author: string;
  synopsis: string;
  language: string;
  genreTag: string;
  categoryId: string | null;
  rating: number;
  pageCount: number;
  isFree: boolean;
  isTrending: boolean;
  isStaffPick: boolean;
  isBookOfTheDay: boolean;
  status: "draft" | "published";
};

export type EpubInfo = {
  title: string;
  author: string;
  language: string;
  description: string;
  wordCount: number;
  pageCount: number;
  chapters: number;
  hasCover: boolean;
};

export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };

export type Stats = {
  books: number;
  publishedBooks: number;
  draftBooks: number;
  freeBooks: number;
  categories: number;
  totalOpens: number;
  storageBytes: number;
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const BASE = "/api/v1/admin";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, { cache: "no-store", ...init });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {}
    if (res.status === 401) msg = "The admin token is missing or wrong (check READLY_ADMIN_TOKEN).";
    throw new ApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const api = {
  stats: () => request<Stats>("/stats"),

  categories: () => request<Category[]>("/categories"),
  createCategory: (c: Pick<Category, "name" | "description" | "sortOrder">) =>
    request<Category>("/categories", json("POST", c)),
  updateCategory: (id: string, c: Pick<Category, "name" | "description" | "sortOrder">) =>
    request<Category>(`/categories/${id}`, json("PUT", c)),
  deleteCategory: (id: string) => request<void>(`/categories/${id}`, { method: "DELETE" }),
  setCategoryImage: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("image", file);
    return request<Category>(`/categories/${id}/image`, { method: "PUT", body: fd });
  },

  books: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") qs.set(k, String(v));
    return request<Page<Book>>(`/books?${qs}`);
  },
  book: (id: string) => request<Book>(`/books/${id}`),
  inspectEpub: (file: File) => {
    const fd = new FormData();
    fd.append("epub", file);
    return request<EpubInfo>("/epub/inspect", { method: "POST", body: fd });
  },
  createBook: (input: BookInput, epub: File, cover?: File | null) => {
    const fd = new FormData();
    fd.append("metadata", JSON.stringify(input));
    fd.append("epub", epub);
    if (cover) fd.append("cover", cover);
    return request<Book>("/books", { method: "POST", body: fd });
  },
  updateBook: (id: string, input: BookInput) => request<Book>(`/books/${id}`, json("PUT", input)),
  deleteBook: (id: string) => request<void>(`/books/${id}`, { method: "DELETE" }),
  replaceEpub: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("epub", file);
    return request<Book>(`/books/${id}/epub`, { method: "PUT", body: fd });
  },
  replaceCover: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("cover", file);
    return request<Book>(`/books/${id}/cover`, { method: "PUT", body: fd });
  },
};

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const READER_URL = process.env.NEXT_PUBLIC_READER_URL ?? "http://localhost:3000";
