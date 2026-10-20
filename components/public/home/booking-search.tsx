"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronDown, Search, User } from "lucide-react";
import { DateRangePicker } from "../date-range-picker";

const fmt = (d: string) => (d ? new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "Select date");

/** Horizontal search panel: check-in, check-out, guests. Search opens the pricing page with a live quote. */
export function BookingSearch({ today, maxGuests, airbnbUrl }: { today: string; maxGuests: number; airbnbUrl?: string | null }) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<"dates" | "guests" | null>(null);
  const [range, setRange] = useState({ checkIn: "", checkOut: "" });
  const [guests, setGuests] = useState(2);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(null); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  function search() {
    if (airbnbUrl) {
      window.open(airbnbUrl, "_blank", "noopener,noreferrer");
      return;
    }
    const p = new URLSearchParams({ guests: String(guests) });
    if (range.checkIn) p.set("checkIn", range.checkIn);
    if (range.checkOut) p.set("checkOut", range.checkOut);
    router.push(`/pricing?${p}`);
  }

  const field = "flex flex-1 items-center gap-3 rounded-lg px-4 py-2.5 text-left transition-colors hover:bg-cream/60";
  return (
    <div ref={box} className="relative" role="search" aria-label="Check availability and pricing">
      <div className="flex flex-col gap-1 rounded-2xl border border-beige bg-white p-2 shadow-[0_10px_28px_-20px_rgba(36,33,31,.4)] sm:flex-row sm:items-center sm:gap-0">
        <button type="button" className={field} onClick={() => setOpen(open === "dates" ? null : "dates")} aria-expanded={open === "dates"} aria-haspopup="dialog">
          <CalendarDays className="h-5 w-5 shrink-0 text-terracotta" aria-hidden />
          <span><span className="block text-[0.78rem] font-semibold">Check In</span><span className="block text-[0.7rem] text-espresso/55" data-testid="search-checkin">{fmt(range.checkIn)}</span></span>
        </button>
        <span className="hidden h-9 w-px bg-beige sm:block" aria-hidden />
        <button type="button" className={field} onClick={() => setOpen(open === "dates" ? null : "dates")} aria-expanded={open === "dates"} aria-haspopup="dialog">
          <CalendarDays className="h-5 w-5 shrink-0 text-terracotta" aria-hidden />
          <span><span className="block text-[0.78rem] font-semibold">Check Out</span><span className="block text-[0.7rem] text-espresso/55">{fmt(range.checkOut)}</span></span>
        </button>
        <span className="hidden h-9 w-px bg-beige sm:block" aria-hidden />
        <div className="relative flex-1">
          <button type="button" className={`${field} w-full`} onClick={() => setOpen(open === "guests" ? null : "guests")} aria-expanded={open === "guests"} aria-haspopup="listbox">
            <User className="h-5 w-5 shrink-0 text-terracotta" aria-hidden />
            <span className="flex-1"><span className="block text-[0.78rem] font-semibold">Guests</span><span className="block text-[0.7rem] text-espresso/55">{guests} guest{guests > 1 ? "s" : ""}</span></span>
            <ChevronDown className="h-4 w-4 text-espresso/60" aria-hidden />
          </button>
          {open === "guests" && (
            <ul role="listbox" aria-label="Number of guests" className="absolute left-0 top-full z-30 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-beige bg-white py-1 shadow-xl">
              {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
                <li key={n} role="option" aria-selected={n === guests}>
                  <button type="button" className={`w-full px-4 py-2 text-left text-sm hover:bg-cream ${n === guests ? "font-semibold text-terracotta" : ""}`} onClick={() => { setGuests(n); setOpen(null); }}>{n} guest{n > 1 ? "s" : ""}</button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" onClick={search} aria-label="Search dates and pricing" className="flex h-12 w-full items-center justify-center rounded-lg bg-terracotta text-white transition-colors hover:bg-terracotta-dark sm:ml-1 sm:h-12 sm:w-12 sm:rounded-lg" data-testid="search-submit">
          <span className="text-sm font-medium sm:hidden">Search</span><Search className="ml-2 h-4 w-4 sm:ml-0 sm:h-5 sm:w-5" aria-hidden />
        </button>
      </div>
      {open === "dates" && (
        <div className="absolute left-0 top-full z-30 mt-2 w-full max-w-[24rem]" role="dialog" aria-label="Choose dates">
          <DateRangePicker today={today} checkIn={range.checkIn} checkOut={range.checkOut} showPrices={false}
            onChange={(v) => { setRange(v); if (v.checkIn && v.checkOut) setOpen(null); }} />
        </div>
      )}
    </div>
  );
}
