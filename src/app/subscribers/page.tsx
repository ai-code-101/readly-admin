"use client";

import { useEffect, useState } from "react";
import { api, formatDateTime, nairobiToday, prettyPhone, type Subscriber } from "@/lib/api";
import { ErrorBanner, PageHeader } from "@/components/ui";

export default function SubscribersPage() {
  const [date, setDate] = useState(nairobiToday);
  const [rows, setRows] = useState<Subscriber[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active">("all");

  useEffect(() => {
    let stale = false;
    api
      .subscribers(date)
      .then((r) => !stale && (setRows(r.items), setError(null)))
      .catch((e) => !stale && setError(e.message));
    return () => {
      stale = true;
    };
  }, [date]);

  const shown = rows?.filter((r) => filter === "all" || r.activeNow) ?? null;
  const activeNow = rows?.filter((r) => r.activeNow).length ?? 0;
  const isToday = date === nairobiToday();

  return (
    <>
      <PageHeader
        title="Subscribers"
        subtitle="Readers with a Ksh 10/day subscription during the selected day (Nairobi time)."
        actions={
          <input type="date" className="input w-auto" value={date} max={nairobiToday()} onChange={(e) => e.target.value && (setRows(null), setDate(e.target.value))} />
        }
      />
      <ErrorBanner message={error} />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Tile label={isToday ? "Subscribed today" : `Subscribed on ${date}`} value={rows?.length} />
        <Tile label="Active right now" value={rows ? activeNow : undefined} />
        <Tile label="Revenue that day (est.)" value={rows ? `Ksh ${rows.length * 10}` : undefined} note="1 day × Ksh 10 per subscriber; billing not connected yet" />
      </div>

      <div className="card overflow-x-auto">
        <div className="flex items-center gap-2 border-b border-cream-200 p-3 text-sm">
          {(["all", "active"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 font-medium ${filter === f ? "bg-forest-800 text-white" : "text-muted hover:text-ink"}`}>
              {f === "all" ? "All that day" : "Active now"}
            </button>
          ))}
        </div>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-cream-200 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Subscribed</th>
              <th className="px-4 py-3 font-semibold">Expires</th>
              <th className="px-4 py-3 font-semibold">Subscriptions</th>
              <th className="px-4 py-3 font-semibold">Books in progress</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {shown === null && !error && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">Loading…</td></tr>}
            {shown?.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">No subscribers {filter === "active" ? "active right now" : "on this day"}.</td></tr>}
            {shown?.map((r) => (
              <tr key={r.userId} className="hover:bg-cream-50">
                <td className="px-4 py-3 font-semibold">{prettyPhone(r.phone)}</td>
                <td className="px-4 py-3">
                  {r.activeNow ? (
                    <span className="rounded-full bg-forest-100 px-2.5 py-0.5 text-xs font-semibold text-forest-800">Active</span>
                  ) : (
                    <span className="rounded-full bg-cream-200 px-2.5 py-0.5 text-xs font-semibold text-muted">Expired</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{formatDateTime(r.periodStartsAt)}</td>
                <td className="px-4 py-3 text-muted">{formatDateTime(r.periodEndsAt)}</td>
                <td className="px-4 py-3">{r.totalSubscriptions}</td>
                <td className="px-4 py-3">{r.booksInProgress}</td>
                <td className="px-4 py-3 text-muted">{formatDateTime(r.joinedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Tile({ label, value, note }: { label: string; value: number | string | undefined; note?: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-muted">{label}</p>
      {value === undefined ? <div className="mt-2 h-9 animate-pulse rounded bg-cream-100" /> : <p className="mt-1 font-display text-4xl text-forest-800">{value}</p>}
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}
