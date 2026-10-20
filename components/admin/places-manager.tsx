"use client";

import { useState } from "react";
import { deleteNearbyPlace, reorder, saveNearbyPlace } from "@/actions/admin";
import { EmptyState, NoticeBar, useAction } from "@/components/ui/feedback";

export interface PlaceRow { id: string; name: string; description: string; distance: string }
const blank: PlaceRow = { id: "", name: "", description: "", distance: "" };

export function PlacesManager({ rows }: { rows: PlaceRow[] }) {
  const [form, setForm] = useState(blank);
  const { run, pending, notice } = useAction();
  const move = (i: number, d: number) => { const ids = rows.map((r) => r.id); const j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; run(() => reorder({ entity: "place", ids })); };
  return (
    <section className="card p-5">
      <h2 className="text-2xl">Nearby places</h2>
      <p className="mt-1 text-sm text-espresso/70">Only enter distances you have verified.</p>
      <form className="mt-4 grid gap-4 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); run(() => saveNearbyPlace({ ...form, id: form.id || undefined }), { onOk: () => setForm(blank) }); }}>
        <div><label className="label" htmlFor="p-name">Place</label><input id="p-name" className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="label" htmlFor="p-dist">Distance (optional)</label><input id="p-dist" className="input" value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} placeholder="e.g. 10 min drive" /></div>
        <div><label className="label" htmlFor="p-desc">Note (optional)</label><input id="p-desc" className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="flex gap-2 sm:col-span-3"><button className="btn btn-primary" disabled={pending}>{form.id ? "Update place" : "Add place"}</button>{form.id && <button type="button" className="btn btn-outline" onClick={() => setForm(blank)}>Cancel</button>}</div>
      </form>
      <div className="mt-3"><NoticeBar notice={notice} /></div>
      {rows.length === 0 ? <div className="mt-4"><EmptyState title="No places yet" /></div> : (
        <ul className="mt-4 divide-y divide-beige">
          {rows.map((p, i) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <span><strong>{p.name}</strong>{p.distance && ` · ${p.distance}`}{p.description && <span className="block text-espresso/65">{p.description}</span>}</span>
              <span className="flex gap-1"><button className="btn btn-outline btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button><button className="btn btn-outline btn-sm" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Move down">↓</button><button className="btn btn-outline btn-sm" onClick={() => setForm(p)}>Edit</button><button className="btn btn-outline btn-sm" onClick={() => run(() => deleteNearbyPlace({ id: p.id }))}>Remove</button></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
