"use client";

import { useState } from "react";
import { deleteTestimonial, reorder, saveTestimonial } from "@/actions/admin";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, NoticeBar, useAction } from "@/components/ui/feedback";

export interface TestimonialRow { id: string; guestName: string; body: string; rating: string; approved: boolean }
const blank: TestimonialRow = { id: "", guestName: "", body: "", rating: "", approved: false };

export function TestimonialsManager({ rows }: { rows: TestimonialRow[] }) {
  const [form, setForm] = useState<TestimonialRow>(blank);
  const [del, setDel] = useState<TestimonialRow | null>(null);
  const { run, pending, notice } = useAction();
  const move = (i: number, d: number) => { const ids = rows.map((r) => r.id); const j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; run(() => reorder({ entity: "testimonial", ids })); };
  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="text-2xl">{form.id ? "Edit testimonial" : "Add a real guest testimonial"}</h2>
        <p className="mt-1 text-sm text-espresso/70">Add only genuine feedback from real guests, with their permission. Only <strong>approved</strong> testimonials are shown publicly.</p>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); run(() => saveTestimonial({ ...form, id: form.id || undefined }), { onOk: () => setForm(blank) }); }}>
          <div><label className="label" htmlFor="t-name">Guest display name</label><input id="t-name" className="input" required value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} /></div>
          <div><label className="label" htmlFor="t-rating">Rating (optional)</label><select id="t-rating" className="input" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}><option value="">No rating</option>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} / 5</option>)}</select></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="t-body">Review text</label><textarea id="t-body" rows={4} required minLength={10} className="input" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={form.approved} onChange={(e) => setForm({ ...form, approved: e.target.checked })} />Approved (visible publicly)</label>
          <div className="flex gap-2 sm:col-span-2"><button className="btn btn-primary" disabled={pending}>{form.id ? "Update" : "Add testimonial"}</button>{form.id && <button type="button" className="btn btn-outline" onClick={() => setForm(blank)}>Cancel</button>}</div>
        </form>
        <div className="mt-3"><NoticeBar notice={notice} /></div>
      </section>
      {rows.length === 0 ? <EmptyState title="No testimonials yet">The public site shows an enquiry invitation until you approve one.</EmptyState> : (
        <ul className="space-y-3">
          {rows.map((t, i) => (
            <li key={t.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-medium">{t.guestName} {t.rating && <span className="text-sm text-espresso/60">· {t.rating}/5</span>} <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${t.approved ? "bg-olive/20" : "bg-stone-200"}`}>{t.approved ? "Approved" : "Not approved"}</span></p><p className="mt-1 text-sm text-espresso/80">{t.body}</p></div>
                <div className="flex flex-wrap gap-1">
                  <button className="btn btn-outline btn-sm" onClick={() => run(() => saveTestimonial({ ...t, approved: !t.approved }))}>{t.approved ? "Reject" : "Approve"}</button>
                  <button className="btn btn-outline btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                  <button className="btn btn-outline btn-sm" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Move down">↓</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setForm(t)}>Edit</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setDel(t)}>Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog open={!!del} danger title="Remove testimonial?" confirmLabel="Remove" busy={pending} onCancel={() => setDel(null)} onConfirm={() => del && run(() => deleteTestimonial({ id: del.id }), { onOk: () => setDel(null) })}>
        <p>This permanently removes the testimonial from {del?.guestName}.</p>
      </ConfirmDialog>
    </div>
  );
}
