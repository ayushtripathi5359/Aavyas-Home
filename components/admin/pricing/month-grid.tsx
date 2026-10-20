"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { WEEKDAYS, addDays, daysInMonth, weekdayOf } from "@/lib/pricing/dates";

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const pad = (n: number) => String(n).padStart(2, "0");

export type View = { year: number; month: number };

export function shiftMonth(v: View, d: number): View {
  const idx = v.year * 12 + (v.month - 1) + d;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

/** Month grid with year/month navigation. Cells are rendered by the caller. */
export function MonthGrid({ view, onView, cell }: { view: View; onView: (v: View) => void; cell: (date: string) => React.ReactNode }) {
  const first = `${view.year}-${pad(view.month)}-01`;
  const lead = WEEKDAYS.indexOf(weekdayOf(first));
  const dates = Array.from({ length: daysInMonth(view.year, view.month) }, (_, i) => addDays(first, i));
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button type="button" className="rounded-full p-2 hover:bg-cream" onClick={() => onView(shiftMonth(view, -12))} aria-label="Previous year"><ChevronLeft className="h-4 w-4" /><ChevronLeft className="-ml-3 h-4 w-4" /></button>
          <button type="button" className="rounded-full p-2 hover:bg-cream" onClick={() => onView(shiftMonth(view, -1))} aria-label="Previous month"><ChevronLeft className="h-5 w-5" /></button>
        </div>
        <p className="font-serif text-2xl" aria-live="polite">{MONTHS[view.month - 1]} {view.year}</p>
        <div className="flex items-center gap-1">
          <button type="button" className="rounded-full p-2 hover:bg-cream" onClick={() => onView(shiftMonth(view, 1))} aria-label="Next month"><ChevronRight className="h-5 w-5" /></button>
          <button type="button" className="rounded-full p-2 hover:bg-cream" onClick={() => onView(shiftMonth(view, 12))} aria-label="Next year"><ChevronRight className="h-4 w-4" /><ChevronRight className="-ml-3 h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wide text-espresso/60">{WEEKDAYS.map((w) => <span key={w}>{w.slice(0, 3)}</span>)}</div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} />)}
        {dates.map((d) => <div key={d}>{cell(d)}</div>)}
      </div>
    </div>
  );
}
