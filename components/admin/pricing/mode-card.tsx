"use client";

import { useState } from "react";
import { setPricingMode } from "@/actions/pricing";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { NoticeBar, useAction } from "@/components/ui/feedback";
import { WEEKDAYS, WEEKDAY_LABELS } from "@/lib/pricing/dates";

type Mode = "WEEKLY" | "DAILY";

export function ModeCard({ active, weekly, dailyFutureCount, updatedAt }: {
  active: Mode;
  weekly: { weekday: (typeof WEEKDAYS)[number]; price: string; active: boolean }[];
  dailyFutureCount: number;
  updatedAt: string | null;
}) {
  const { run, pending, notice } = useAction();
  const [target, setTarget] = useState<Mode | null>(null);

  const options: { mode: Mode; title: string; text: string }[] = [
    { mode: "WEEKLY", title: "Weekly pricing", text: "Set a standard rate for each day of the week. Prices repeat automatically every week." },
    { mode: "DAILY", title: "Daily manual pricing", text: "Set the price for each calendar date individually. Every date can have a different rate." },
  ];

  return (
    <section className="card p-5" aria-labelledby="mode-h">
      <h2 id="mode-h" className="text-2xl">Pricing mode</h2>
      <p className="mt-1 text-sm text-espresso/70">Only the active mode affects public prices. Saved data for the other mode is kept.{updatedAt && <> Last changed {updatedAt}.</>}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {options.map((o) => {
          const isActive = o.mode === active;
          return (
            <div key={o.mode} className={`rounded-2xl border p-4 ${isActive ? "border-terracotta bg-terracotta/5" : "border-beige"}`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl">{o.title}</h3>
                {isActive && <span className="rounded-full bg-terracotta px-2.5 py-0.5 text-xs text-white" data-testid={`active-${o.mode}`}>Active</span>}
              </div>
              <p className="mt-1 text-sm text-espresso/75">{o.text}</p>
              {!isActive && <button className="btn btn-outline btn-sm mt-3" onClick={() => setTarget(o.mode)} data-testid={`switch-${o.mode}`}>Switch to this mode</button>}
            </div>
          );
        })}
      </div>
      <div className="mt-3"><NoticeBar notice={notice} /></div>

      <ConfirmDialog
        open={target !== null}
        title={target === "DAILY" ? "Switch to daily manual pricing?" : "Switch to weekly pricing?"}
        confirmLabel="Switch mode"
        busy={pending}
        onCancel={() => setTarget(null)}
        onConfirm={() => target && run(() => setPricingMode({ mode: target, confirmed: true }), { onOk: () => setTarget(null), onFail: () => setTarget(null) })}
      >
        {target === "DAILY" ? (
          <>
            <p><strong>Dates without a manually configured price cannot be quoted.</strong> Guests will be asked to enquire for a custom quote on those dates. Weekly rates are not used as a fallback.</p>
            <p>{dailyFutureCount} date(s) currently have a saved daily price or status.</p>
          </>
        ) : (
          <>
            <p>These recurring prices will become active:</p>
            <ul className="space-y-0.5">
              {WEEKDAYS.map((d) => { const r = weekly.find((w) => w.weekday === d); return <li key={d}>{WEEKDAY_LABELS[d]}: {r && r.active && r.price ? `₹${Number(r.price).toLocaleString("en-IN")}` : <em>no rate (cannot be quoted)</em>}</li>; })}
            </ul>
            <p>Daily prices are kept but will not be used.</p>
          </>
        )}
      </ConfirmDialog>
    </section>
  );
}
