"use client";

import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl text-forest-800">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-6 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
      {message}
    </div>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
            <defs>
              <linearGradient id={`s${i}-${fill}`}>
                <stop offset={`${fill * 100}%`} stopColor="#e3b23c" />
                <stop offset={`${fill * 100}%`} stopColor="#e5e0d2" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#s${i}-${fill})`}
              d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
            />
          </svg>
        );
      })}
    </span>
  );
}

export function StatusPill({ status }: { status: "draft" | "published" }) {
  return status === "published" ? (
    <span className="rounded-full bg-forest-100 px-2.5 py-0.5 text-xs font-semibold text-forest-800">Published</span>
  ) : (
    <span className="rounded-full bg-cream-200 px-2.5 py-0.5 text-xs font-semibold text-muted">Draft</span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-forest-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-forest-700">
      {children}
    </span>
  );
}

export function CoverThumb({ src, title, className = "h-16 w-11" }: { src?: string; title: string; className?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={`Cover of ${title}`} className={`${className} rounded-md object-cover shadow-sm`} />
  ) : (
    <div className={`${className} grid place-items-center rounded-md bg-forest-800 p-1 text-center text-[8px] leading-tight text-white/80`}>
      {title.slice(0, 24)}
    </div>
  );
}

export function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />;
}
