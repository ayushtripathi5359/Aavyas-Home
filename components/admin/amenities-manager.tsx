"use client";

import { useState } from "react";
import { deleteAmenity, reorder, saveAmenity } from "@/actions/admin";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, NoticeBar, useAction } from "@/components/ui/feedback";
import { AmenityIcon } from "@/components/ui/icons";
import { AMENITY_ICONS } from "@/lib/validation/schemas";

export interface AmenityRow { id: string; name: string; description: string; icon: string; enabled: boolean }
const blank: AmenityRow = { id: "", name: "", description: "", icon: "Check", enabled: false };

export function AmenitiesManager({ rows }: { rows: AmenityRow[] }) {
  const [form, setForm] = useState<AmenityRow>(blank);
  const [del, setDel] = useState<AmenityRow | null>(null);
  const { run, pending, notice } = useAction();
  const move = (i: number, d: number) => { const ids = rows.map((r) => r.id); const j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; run(() => reorder({ entity: "amenity", ids })); };

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="text-2xl">{form.id ? "Edit amenity" : "New amenity"}</h2>
        <p className="mt-1 text-sm text-espresso/70">Only <strong>enabled</strong> amenities appear on the public site. Enable an amenity only once you have confirmed it is available.</p>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); run(() => saveAmenity({ ...form, id: form.id || undefined }), { onOk: () => setForm(blank) }); }}>
          <div><label className="label" htmlFor="a-name">Name</label><input id="a-name" className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label" htmlFor="a-icon">Icon</label>
            <div className="flex items-center gap-3"><span className="rounded-full bg-cream p-3 text-terracotta"><AmenityIcon name={form.icon} className="h-5 w-5" /></span>
              <select id="a-icon" className="input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>{AMENITY_ICONS.map((i) => <option key={i} value={i}>{i}</option>)}</select></div></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="a-desc">Description (optional)</label><input id="a-desc" className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />Enabled (visible publicly)</label>
          <div className="flex gap-2 sm:col-span-2"><button className="btn btn-primary" disabled={pending}>{form.id ? "Update amenity" : "Add amenity"}</button>{form.id && <button type="button" className="btn btn-outline" onClick={() => setForm(blank)}>Cancel</button>}</div>
        </form>
        <div className="mt-3"><NoticeBar notice={notice} /></div>
      </section>

      {rows.length === 0 ? <EmptyState title="No amenities yet" /> : (
        <ul className="space-y-2">
          {rows.map((a, i) => (
            <li key={a.id} className="card flex flex-wrap items-center justify-between gap-3 p-3">
              <span className="flex items-center gap-3"><AmenityIcon name={a.icon} className="h-5 w-5 text-terracotta" /><span className="font-medium">{a.name}</span></span>
              <span className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={a.enabled} onChange={(e) => run(() => saveAmenity({ ...a, enabled: e.target.checked }))} aria-label={`${a.name} enabled`} />Enabled</label>
                <button className="btn btn-outline btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                <button className="btn btn-outline btn-sm" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Move down">↓</button>
                <button className="btn btn-outline btn-sm" onClick={() => setForm(a)}>Edit</button>
                <button className="btn btn-outline btn-sm" onClick={() => setDel(a)}>Delete</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog open={!!del} danger title="Delete amenity?" confirmLabel="Delete" busy={pending} onCancel={() => setDel(null)} onConfirm={() => del && run(() => deleteAmenity({ id: del.id }), { onOk: () => setDel(null) })}>
        <p>“{del?.name}” will be removed from all spaces.</p>
      </ConfirmDialog>
    </div>
  );
}
