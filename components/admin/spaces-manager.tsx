"use client";

import Link from "next/link";
import { useState } from "react";
import { archiveSpace, reorder, saveSpace } from "@/actions/admin";
import { EmptyState, NoticeBar, useAction } from "@/components/ui/feedback";
import { CATEGORY_LABELS } from "@/lib/validation/schemas";

export interface SpaceRow {
  id: string; name: string; slug: string; category: string; summary: string; description: string; occupancy: string; bedDetails: string; houseRules: string;
  coverImageId: string; featured: boolean; published: boolean; archived: boolean; amenityIds: string[];
}
const blank: SpaceRow = { id: "", name: "", slug: "", category: "OTHER", summary: "", description: "", occupancy: "", bedDetails: "", houseRules: "", coverImageId: "", featured: false, published: false, archived: false, amenityIds: [] };
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function SpacesManager({ spaces, images, amenities }: { spaces: SpaceRow[]; images: { id: string; label: string }[]; amenities: { id: string; name: string }[] }) {
  const [form, setForm] = useState<SpaceRow | null>(null);
  const { run, pending, notice } = useAction();
  const set = (p: Partial<SpaceRow>) => setForm((f) => (f ? { ...f, ...p } : f));
  const move = (i: number, d: number) => { const ids = spaces.filter((s) => !s.archived).map((s) => s.id); const j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; run(() => reorder({ entity: "space", ids })); };
  const live = spaces.filter((s) => !s.archived);

  return (
    <div className="space-y-6">
      {!form && <button className="btn btn-primary" onClick={() => setForm({ ...blank })} data-testid="new-space">New space</button>}
      <NoticeBar notice={notice} />
      {form && (
        <section className="card p-5" aria-labelledby="space-form">
          <h2 id="space-form" className="text-2xl">{form.id ? `Edit ${form.name}` : "New space"}</h2>
          <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); run(() => saveSpace({ ...form, id: form.id || undefined }), { onOk: () => setForm(null) }); }}>
            <div><label className="label" htmlFor="s-name">Name</label><input id="s-name" className="input" required value={form.name} onChange={(e) => set({ name: e.target.value, ...(form.id ? {} : { slug: slugify(e.target.value) }) })} /></div>
            <div><label className="label" htmlFor="s-slug">Slug (URL)</label><input id="s-slug" className="input" required value={form.slug} onChange={(e) => set({ slug: e.target.value })} /></div>
            <div><label className="label" htmlFor="s-cat">Category</label><select id="s-cat" className="input" value={form.category} onChange={(e) => set({ category: e.target.value })}>{Object.entries(CATEGORY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            <div><label className="label" htmlFor="s-cover">Cover image</label><select id="s-cover" className="input" value={form.coverImageId} onChange={(e) => set({ coverImageId: e.target.value })}><option value="">Automatic</option>{images.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}</select></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="s-sum">Short description</label><input id="s-sum" className="input" value={form.summary} onChange={(e) => set({ summary: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="s-desc">Full description</label><textarea id="s-desc" rows={4} className="input" value={form.description} onChange={(e) => set({ description: e.target.value })} /></div>
            <div><label className="label" htmlFor="s-occ">Occupancy (optional)</label><input id="s-occ" className="input" value={form.occupancy} onChange={(e) => set({ occupancy: e.target.value })} /></div>
            <div><label className="label" htmlFor="s-bed">Bed details (optional)</label><input id="s-bed" className="input" value={form.bedDetails} onChange={(e) => set({ bedDetails: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="s-rules">House rules (optional)</label><textarea id="s-rules" rows={2} className="input" value={form.houseRules} onChange={(e) => set({ houseRules: e.target.value })} /></div>
            <fieldset className="sm:col-span-2"><legend className="label">Amenities in this space</legend>
              <div className="flex flex-wrap gap-3">{amenities.map((a) => (
                <label key={a.id} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={form.amenityIds.includes(a.id)} onChange={(e) => set({ amenityIds: e.target.checked ? [...form.amenityIds, a.id] : form.amenityIds.filter((x) => x !== a.id) })} />{a.name}</label>
              ))}{amenities.length === 0 && <span className="text-sm text-espresso/60">Create amenities first.</span>}</div></fieldset>
            <div className="flex flex-wrap gap-5 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={form.featured} onChange={(e) => set({ featured: e.target.checked })} />Featured</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={form.published} onChange={(e) => set({ published: e.target.checked })} />Published</label>
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button className="btn btn-primary" disabled={pending} data-testid="save-space">Save space</button>
              {form.slug && <Link href={`/rooms/${form.slug}`} target="_blank" className="btn btn-outline">Preview public page</Link>}
              <button type="button" className="btn btn-outline" onClick={() => setForm(null)}>Cancel</button>
            </div>
          </form>
        </section>
      )}

      {spaces.length === 0 ? <EmptyState title="No spaces yet" /> : (
        <ul className="space-y-3">
          {live.map((s, i) => (
            <li key={s.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div><p className="font-medium">{s.name} <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${s.published ? "bg-olive/20" : "bg-stone-200"}`}>{s.published ? "Published" : "Draft"}</span></p><p className="text-sm text-espresso/60">/rooms/{s.slug} · {CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS]}</p></div>
              <div className="flex flex-wrap gap-1">
                <button className="btn btn-outline btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${s.name} earlier`}>↑</button>
                <button className="btn btn-outline btn-sm" onClick={() => move(i, 1)} disabled={i === live.length - 1} aria-label={`Move ${s.name} later`}>↓</button>
                <button className="btn btn-outline btn-sm" onClick={() => setForm(s)}>Edit</button>
                <button className="btn btn-outline btn-sm" onClick={() => run(() => saveSpace({ ...s, published: !s.published }))}>{s.published ? "Unpublish" : "Publish"}</button>
                <button className="btn btn-outline btn-sm" onClick={() => run(() => archiveSpace({ id: s.id, archived: true }))}>Archive</button>
              </div>
            </li>
          ))}
          {spaces.filter((s) => s.archived).map((s) => (
            <li key={s.id} className="card flex items-center justify-between gap-3 bg-stone-100 p-4 text-sm"><span>{s.name} <em>(archived)</em></span><button className="btn btn-outline btn-sm" onClick={() => run(() => archiveSpace({ id: s.id, archived: false }))}>Restore</button></li>
          ))}
        </ul>
      )}
    </div>
  );
}
