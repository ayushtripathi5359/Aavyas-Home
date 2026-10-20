"use client";

import { useState } from "react";
import { deleteOverride, saveOverride } from "@/actions/pricing";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, NoticeBar, useAction } from "@/components/ui/feedback";

export interface OverrideRow { id: string; name: string; startDate: string; endDate: string; price: string; active: boolean; notes: string | null }
const blank = { id: "", name: "", startDate: "", endDate: "", price: "", active: true, notes: "" };

export function OverridesManager({ rows, modeActive }: { rows: OverrideRow[]; modeActive: boolean }) {
  const [form, setForm] = useState(blank);
  const [del, setDel] = useState<OverrideRow | null>(null);
  const { run, pending, notice } = useAction();
  const set = (p: Partial<typeof blank>) => setForm((f) => ({ ...f, ...p }));

  return (
    <div className="space-y-6">
      {!modeActive && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Date overrides apply only in <strong>weekly</strong> mode. They are saved but currently unused.</p>}
      <section className="card p-5">
        <h2 className="text-2xl">{form.id ? "Edit override" : "New date-specific override"}</h2>
        <p className="mt-1 text-sm text-espresso/70">Replaces the weekday rate for each night in the range. The start date is included; the end date is <strong>not</strong> (the last priced night is the day before it). Active overrides cannot overlap.</p>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); run(() => saveOverride({ ...form, id: form.id || undefined }), { onOk: () => setForm(blank) }); }}>
          <div><label className="label" htmlFor="o-name">Name</label><input id="o-name" className="input" required value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Festival weekend" /></div>
          <div><label className="label" htmlFor="o-price">Price per night (₹)</label><input id="o-price" className="input" required inputMode="decimal" value={form.price} onChange={(e) => set({ price: e.target.value })} /></div>
          <div><label className="label" htmlFor="o-start">Start date (inclusive)</label><input id="o-start" type="date" className="input" required value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} /></div>
          <div><label className="label" htmlFor="o-end">End date (exclusive)</label><input id="o-end" type="date" className="input" required value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="o-notes">Internal notes</label><input id="o-notes" className="input" value={form.notes} onChange={(e) => set({ notes: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={form.active} onChange={(e) => set({ active: e.target.checked })} />Active</label>
          <div className="flex gap-2 sm:col-span-2">
            <button className="btn btn-primary" disabled={pending} data-testid="save-override">{form.id ? "Update override" : "Add override"}</button>
            {form.id && <button type="button" className="btn btn-outline" onClick={() => setForm(blank)}>Cancel edit</button>}
          </div>
          <div className="sm:col-span-2"><NoticeBar notice={notice} /></div>
        </form>
      </section>

      {rows.length === 0 ? <EmptyState title="No overrides yet" /> : (
        <ul className="space-y-3">
          {rows.map((o) => (
            <li key={o.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div><p className="font-medium">{o.name} {!o.active && <span className="ml-1 rounded-full bg-stone-200 px-2 py-0.5 text-xs">inactive</span>}</p>
                <p className="text-sm text-espresso/70">{o.startDate} → {o.endDate} (end excluded) · ₹{Number(o.price).toLocaleString("en-IN")} / night</p>{o.notes && <p className="text-xs text-espresso/55">{o.notes}</p>}</div>
              <div className="flex gap-2">
                <button className="btn btn-outline btn-sm" onClick={() => setForm({ id: o.id, name: o.name, startDate: o.startDate, endDate: o.endDate, price: o.price, active: o.active, notes: o.notes ?? "" })}>Edit</button>
                <button className="btn btn-outline btn-sm" onClick={() => setDel(o)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog open={!!del} danger title="Delete this override?" confirmLabel="Delete" busy={pending} onCancel={() => setDel(null)}
        onConfirm={() => del && run(() => deleteOverride({ id: del.id }), { onOk: () => setDel(null) })}>
        <p>“{del?.name}” will be removed. Dates it covered return to their weekday rate.</p>
      </ConfirmDialog>
    </div>
  );
}
