"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { publicMonthPrices } from "@/actions/public";
import type { MonthDay } from "@/lib/pricing/service";
import { addDays, daysInMonth, weekdayOf, WEEKDAYS } from "@/lib/pricing/dates";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const pad = (n: number) => String(n).padStart(2, "0");

/** Calendar for choosing check-in (first night) and check-out (not charged). Past dates are disabled. */
export function DateRangePicker({
  today, checkIn, checkOut, onChange, showPrices = true,
}: {
  today: string;
  checkIn: string;
  checkOut: string;
  onChange: (v: { checkIn: string; checkOut: string }) => void;
  showPrices?: boolean;
}) {
  const [y0, m0] = today.split("-").map(Number);
  const [view, setView] = useState(() => {
    const start = checkIn && checkIn >= today ? checkIn : today;
    return { year: Number(start.slice(0, 4)), month: Number(start.slice(5, 7)) };
  });
  const [prices, setPrices] = useState<Record<string, MonthDay>>({});
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    if (!showPrices) return;
    let alive = true;
    publicMonthPrices(view).then((r) => {
      if (alive && r.ok && r.data) setPrices((p) => ({ ...p, ...Object.fromEntries(r.data!.map((d) => [d.date, d])) }));
    });
    return () => { alive = false; };
  }, [view, showPrices]);

  const first = `${view.year}-${pad(view.month)}-01`;
  const lead = WEEKDAYS.indexOf(weekdayOf(first));
  const total = daysInMonth(view.year, view.month);
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => addDays(first, i))];
  const atMin = view.year === y0 && view.month === m0;

  const move = (d: number) => setView((v) => {
    const idx = v.year * 12 + (v.month - 1) + d;
    return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
  });

  function pick(date: string) {
    if (date < today) return;
    if (!checkIn || (checkIn && checkOut) || date <= checkIn) onChange({ checkIn: date, checkOut: "" });
    else onChange({ checkIn, checkOut: date });
  }

  const rangeEnd = checkOut || (checkIn && hover && hover > checkIn ? hover : "");

  return (
    <div className="card p-4 sm:p-5" role="group" aria-label="Choose your dates">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" className="rounded-full p-2 hover:bg-cream disabled:opacity-30" onClick={() => move(-1)} disabled={atMin} aria-label="Previous month"><ChevronLeft className="h-5 w-5" /></button>
        <p className="font-serif text-xl" aria-live="polite">{MONTHS[view.month - 1]} {view.year}</p>
        <button type="button" className="rounded-full p-2 hover:bg-cream" onClick={() => move(1)} aria-label="Next month"><ChevronRight className="h-5 w-5" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wide text-espresso/60">
        {WEEKDAYS.map((w) => <span key={w}>{w.slice(0, 3)}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1" onMouseLeave={() => setHover(null)}>
        {cells.map((d, i) => {
          if (!d) return <span key={`b${i}`} />;
          const past = d < today;
          const isStart = d === checkIn, isEnd = d === checkOut;
          const inRange = checkIn && rangeEnd && d > checkIn && d < rangeEnd;
          const p = prices[d];
          return (
            <button
              key={d}
              type="button"
              disabled={past}
              onClick={() => pick(d)}
              onMouseEnter={() => setHover(d)}
              aria-pressed={isStart || isEnd}
              aria-label={`${d}${isStart ? ", check-in" : ""}${isEnd ? ", check-out" : ""}${p?.price ? `, ₹${Number(p.price)} per night` : ""}`}
              className={`flex min-h-12 flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                isStart || isEnd ? "bg-terracotta text-white" : inRange ? "bg-terracotta/15" : "hover:bg-cream"
              } ${past ? "cursor-not-allowed text-espresso/25" : ""}`}
            >
              <span>{Number(d.slice(8))}</span>
              {showPrices && !past && (
                <span className={`text-[10px] leading-none ${isStart || isEnd ? "text-white/90" : "text-espresso/55"}`}>
                  {p?.price ? Number(p.price).toLocaleString("en-IN") : p ? "—" : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-espresso/60">Choose check-in, then check-out. The check-out date is not charged as a night. Prices shown are per night; “—” means no published price.</p>
    </div>
  );
}
