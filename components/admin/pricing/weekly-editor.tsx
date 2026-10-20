"use client";

import { useMemo, useState } from "react";
import { saveWeeklyRates } from "@/actions/pricing";
import { NoticeBar, useAction } from "@/components/ui/feedback";
import { WEEKDAYS, WEEKDAY_LABELS, todayInZone, type WeekdayName } from "@/lib/pricing/dates";
import { priceForNight, type OverrideRule } from "@/lib/pricing/engine";
import { MonthGrid, type View } from "./month-grid";

interface Row { weekday: WeekdayName; price: string; active: boolean }

export function WeeklyEditor({ initial, overrides, modeActive }: { initial: Row[]; overrides: OverrideRule[]; modeActive: boolean }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [picked, setPicked] = useState<Set<WeekdayName>>(new Set());
  const { run, pending, notice } = useAction();
  const today = todayInZone();
  const [view, setView] = useState<View>({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) });

  const set = (d: WeekdayName, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.weekday === d ? { ...r, ...patch } : r)));
  const togglePick = (d: WeekdayName) => setPicked((p) => { const n = new Set(p); n.has(d) ? n.delete(d) : n.add(d); return n; });

  // Live preview using the same engine as the public site, with unsaved edits applied.
  const rules = useMemo(() => ({
    mode: "WEEKLY" as const, currency: "INR", includedGuests: 1, daily: {}, charges: [], overrides,
    weekly: Object.fromEntries(rows.filter((r) => r.active && r.price !== "").map((r) => [r.weekday, Number(r.price).toFixed(2)])),
  }), [rows, overrides]);

  const dirty = JSON.stringify(rows) !== JSON.stringify(initial);

  return (
    <div className="space-y-6">
      {!modeActive && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Weekly pricing is saved but <strong>not currently active</strong>. Public prices use daily manual rates.</p>}
      <section className="card p-5">
        <h2 className="text-2xl">Recurring weekday rates</h2>
        <p className="mt-1 text-sm text-espresso/70">Set a standard rate for each day of the week. Prices repeat automatically every week until changed.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-espresso/60"><tr><th className="py-2 pr-2">Select</th><th>Day</th><th>Price per night (₹)</th><th>Active</th><th /></tr></thead>
            <tbody className="divide-y divide-beige">
              {WEEKDAYS.map((d) => {
                const r = rows.find((x) => x.weekday === d)!;
                return (
                  <tr key={d}>
                    <td className="py-2 pr-2"><input type="checkbox" className="h-5 w-5" checked={picked.has(d)} onChange={() => togglePick(d)} aria-label={`Select ${WEEKDAY_LABELS[d]}`} /></td>
                    <td className="pr-3 font-medium">{WEEKDAY_LABELS[d]}</td>
                    <td className="pr-3"><input className="input max-w-40" inputMode="decimal" value={r.price} onChange={(e) => set(d, { price: e.target.value })} aria-label={`${WEEKDAY_LABELS[d]} price`} placeholder="Not set" /></td>
                    <td><input type="checkbox" className="h-5 w-5" checked={r.active} onChange={(e) => set(d, { active: e.target.checked })} aria-label={`${WEEKDAY_LABELS[d]} active`} /></td>
                    <td className="pl-3"><button type="button" className="text-xs text-terracotta hover:underline disabled:opacity-40" disabled={picked.size === 0 || r.price === ""} onClick={() => setRows((rs) => rs.map((x) => (picked.has(x.weekday) ? { ...x, price: r.price } : x)))}>Copy to selected</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <ApplyAll onApply={(price) => setRows((rs) => rs.map((x) => ({ ...x, price })))} />
          <button className="btn btn-primary" disabled={pending || !dirty} data-testid="save-weekly"
            onClick={() => run(() => saveWeeklyRates({ rates: rows.map((r) => ({ weekday: r.weekday, price: r.price.trim(), active: r.active })) }))}>
            {pending ? "Saving…" : "Save & publish weekly rates"}
          </button>
          {dirty && <span className="text-sm text-amber-800">Unsaved changes</span>}
        </div>
        <div className="mt-3"><NoticeBar notice={notice} /></div>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-2xl">Calendar preview</h2>
        <p className="mb-4 text-sm text-espresso/70">Shows nightly prices from the weekday rates above (including unsaved edits) and your date overrides.</p>
        <MonthGrid view={view} onView={setView} cell={(date) => {
          const p = priceForNight(date, rules);
          return (
            <div className={`flex min-h-14 flex-col items-center justify-center rounded-lg border text-xs ${p.source === "OVERRIDE" ? "border-terracotta bg-terracotta/10" : p.price ? "border-beige bg-white" : "border-dashed border-amber-400 bg-amber-50"}`} title={p.overrideName ?? undefined}>
              <span className="text-[11px] text-espresso/60">{Number(date.slice(8))}</span>
              <span className="font-medium">{p.price ? Number(p.price).toLocaleString("en-IN") : "—"}</span>
              {p.overrideName && <span className="max-w-full truncate px-1 text-[9px] text-terracotta">{p.overrideName}</span>}
            </div>
          );
        }} />
      </section>
    </div>
  );
}

function ApplyAll({ onApply }: { onApply: (p: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="flex items-end gap-2">
      <div><label className="label" htmlFor="all-price">Apply one rate to all days</label><input id="all-price" className="input w-40" inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} /></div>
      <button type="button" className="btn btn-outline" disabled={!/^\d+(\.\d{1,2})?$/.test(v)} onClick={() => onApply(v)}>Apply to all</button>
    </div>
  );
}
