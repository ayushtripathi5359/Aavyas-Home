"use client";

import { useState } from "react";

/** Accessible tab set. Panels are server-rendered nodes passed in as props. */
export function Tabs({ tabs, initial }: { tabs: { id: string; label: string; panel: React.ReactNode }[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0].id);
  return (
    <div>
      <div role="tablist" aria-label="Sections" className="mb-6 flex gap-1 overflow-x-auto border-b border-beige">
        {tabs.map((t) => (
          <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={active === t.id} aria-controls={`panel-${t.id}`}
            onClick={() => setActive(t.id)}
            className={`-mb-px shrink-0 border-b-2 px-4 py-3 text-sm ${active === t.id ? "border-terracotta font-medium text-terracotta" : "border-transparent text-espresso/70 hover:text-espresso"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={active !== t.id}>{t.panel}</div>
      ))}
    </div>
  );
}
