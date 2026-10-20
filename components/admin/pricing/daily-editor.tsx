"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminMonth, saveDailyRates } from "@/actions/pricing";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { NoticeBar, useAction } from "@/components/ui/feedback";
import { addDays, diffDays, todayInZone } from "@/lib/pricing/dates";
import { MonthGrid, pad, type View } from "./month-grid";

interface Day { date: string; price: string | null; source: string; daily: { status: "PRICED" | "UNAVAILABLE"; price: string | null } | null }

export function DailyEditor({ modeActive }: { modeActive: boolean }) {
  const today = todayInZone();
  const [view, setView] = useState<View>({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) });
  const [days, setDays] = useState<Record<string, Day>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [anchor, setAnchor] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [confirm, setConfirm] = useState<null | { action: "SET" | "UNAVAILABLE"; message: string }>(null);
  const [range, setRange] = useState({ from: "", to: "" });
  const { run, pending, notice, setNotice } = useAction();

  const load = useCallback(async () => {
    const r = await getAdminMonth(view);
    if (r.ok && r.data) setDays((d) => ({ ...d, ...Object.fromEntries((r.data!.days as Day[]).map((x) => [x.date, x])) }));
  }, [view]);
  useEffect(() => { load(); }, [load]);

  const monthDates = useMemo(() => Object.keys(days).filter((d) => d.startsWith(`${view.year}-${pad(view.month)}`)).sort(), [days, view]);
  const stats = useMemo(() => {
    let configured = 0, missing = 0, unavailable = 0;
    for (const d of monthDates) { const s = days[d].daily; if (!s) missing++; else if (s.status === "UNAVAILABLE") unavailable++; else configured++; }
    return { configured, missing, unavailable, total: monthDates.length };
  }, [days, monthDates]);

  function toggle(date: string, shift: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (shift && anchor) {
        const [a, b] = anchor < date ? [anchor, date] : [date, anchor];
        for (let i = 0; i <= diffDays(a, b); i++) next.add(addDays(a, i));
      } else next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
    setAnchor(date);
    const s = days[date]?.daily;
    if (!shift && s?.price) setPrice(Number(s.price).toString());
  }

  function selectRange() {
    if (!range.from || !range.to || range.to < range.from) return setNotice({ kind: "error", text: "Choose a valid from/to range." });
    const n = new Set(selected);
    for (let i = 0; i <= diffDays(range.from, range.to) && i < 400; i++) n.add(addDays(range.from, i));
    setSelected(n);
  }

  const dates = [...selected].sort();
  const existing = dates.filter((d) => days[d]?.daily).length;

  function apply(action: "SET" | "UNAVAILABLE" | "CLEAR", overwrite = false) {
    if (action === "SET" && !/^\d+(\.\d{1,2})?$/.test(price.trim())) return setNotice({ kind: "error", text: "Enter a valid price, e.g. 1500 or 1500.50." });
    run(() => saveDailyRates({ dates, action, price: price.trim(), overwrite }), {
      onOk: () => { setConfirm(null); setSelected(new Set()); load(); },
      onFail: (r) => { if (r.code === "CONFIRM_OVERWRITE" && action !== "CLEAR") setConfirm({ action, message: r.error }); },
    });
  }

  return (
    <div className="space-y-6">
      {!modeActive && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Daily manual pricing is saved but <strong>not currently active</strong>. Public prices use weekly rates.</p>}
      <section className="card p-5">
        <h2 className="text-2xl">Daily rates</h2>
        <p className="mt-1 text-sm text-espresso/70">Every date needs its own price. Unset dates stay unset — nothing is filled in automatically, and weekly rates are never used as a fallback.</p>
        <ul className="my-4 flex flex-wrap gap-3 text-xs" aria-label="Month completion">
          <li className="rounded-full bg-olive/20 px-3 py-1">Configured: {stats.configured}</li>
          <li className="rounded-full bg-amber-100 px-3 py-1">Missing: {stats.missing}</li>
          <li className="rounded-full bg-stone-200 px-3 py-1">Unavailable: {stats.unavailable}</li>
          <li className="rounded-full bg-cream px-3 py-1">Complete: {stats.total ? Math.round(((stats.configured + stats.unavailable) / stats.total) * 100) : 0}%</li>
        </ul>
        <MonthGrid view={view} onView={setView} cell={(date) => {
          const d = days[date]; const s = d?.daily; const sel = selected.has(date);
          const tone = s?.status === "PRICED" ? "border-olive/50 bg-olive/10" : s?.status === "UNAVAILABLE" ? "border-stone-400 bg-stone-200" : "border-dashed border-amber-400 bg-amber-50";
          return (
            <button type="button" onClick={(e) => toggle(date, e.shiftKey)} aria-pressed={sel} data-date={date}
              aria-label={`${date}: ${s?.status === "PRICED" ? `₹${Number(s.price)}` : s?.status === "UNAVAILABLE" ? "unavailable" : "no price"}${sel ? ", selected" : ""}`}
              className={`flex min-h-14 w-full flex-col items-center justify-center rounded-lg border text-xs transition ${tone} ${sel ? "ring-2 ring-terracotta ring-offset-1" : ""}`}>
              <span className="text-[11px] text-espresso/60">{Number(date.slice(8))}</span>
              <span className="font-medium">{s?.status === "PRICED" ? Number(s.price).toLocaleString("en-IN") : s?.status === "UNAVAILABLE" ? "N/A" : "—"}</span>
            </button>
          );
        }} />
        <p className="mt-3 text-xs text-espresso/60">Click dates to select them (Shift-click for a range). <span className="text-amber-800">Dashed</span> = missing, <span className="text-olive-dark">green</span> = configured, <span>grey N/A</span> = explicitly unavailable for pricing.</p>
      </section>

      <section className="card p-5" aria-labelledby="bulk-h">
        <h2 id="bulk-h" className="text-2xl">Edit selected dates <span className="text-base text-espresso/60">({dates.length})</span></h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div><label className="label" htmlFor="d-from">Select range from</label><input id="d-from" type="date" className="input" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /></div>
          <div><label className="label" htmlFor="d-to">to (inclusive)</label><input id="d-to" type="date" className="input" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></div>
          <button type="button" className="btn btn-outline btn-sm" onClick={selectRange}>Add range to selection</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelected(new Set(monthDates))}>Select whole month</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelected(new Set(monthDates.filter((d) => !days[d].daily)))}>Select missing</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelected(new Set())} disabled={!dates.length}>Clear selection</button>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div><label className="label" htmlFor="d-price">Price per night (₹)</label><input id="d-price" className="input w-40" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} data-testid="daily-price" /></div>
          <button className="btn btn-primary" disabled={pending || !dates.length} onClick={() => apply("SET")} data-testid="apply-daily">Apply price to {dates.length || "selected"} date(s)</button>
          <button className="btn btn-outline" disabled={pending || !dates.length} onClick={() => apply("UNAVAILABLE")}>Mark unavailable</button>
          <button className="btn btn-outline" disabled={pending || !dates.length || existing === 0} onClick={() => apply("CLEAR")}>Clear price</button>
        </div>
        <div className="mt-3"><NoticeBar notice={notice} /></div>
      </section>

      <ConfirmDialog open={confirm !== null} title="Overwrite existing prices?" confirmLabel="Overwrite" danger busy={pending}
        onCancel={() => setConfirm(null)} onConfirm={() => confirm && apply(confirm.action, true)}>
        <p>{confirm?.message}</p>
      </ConfirmDialog>
    </div>
  );
}
