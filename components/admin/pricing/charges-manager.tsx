"use client";

import { useState } from "react";
import { deleteCharge, deleteFaq, saveCharge, saveFaq, savePricingPolicy } from "@/actions/pricing";
import { reorder } from "@/actions/admin";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, NoticeBar, useAction } from "@/components/ui/feedback";

export interface ChargeRow { id: string; type: string; name: string; amount: string; method: string; active: boolean; refundable: boolean }
export interface FaqRow { id: string; question: string; answer: string; published: boolean }

const TYPES = { EXTRA_GUEST: "Extra guest fee", CLEANING: "Cleaning fee", SECURITY_DEPOSIT: "Security deposit", TAX: "Tax", OTHER: "Other fee" };
const METHODS = { FIXED: "Fixed (per stay)", PER_NIGHT: "Per night", PER_PERSON: "Per person", PER_PERSON_PER_NIGHT: "Per person, per night", PERCENT_OF_SUBTOTAL: "Percent of subtotal" };
const blank = { id: "", type: "CLEANING", name: "", amount: "", method: "FIXED", active: true, refundable: false };

export function ChargesManager({ rows }: { rows: ChargeRow[] }) {
  const [form, setForm] = useState(blank);
  const [del, setDel] = useState<ChargeRow | null>(null);
  const { run, pending, notice } = useAction();
  const set = (p: Partial<typeof blank>) => setForm((f) => ({ ...f, ...p }));
  return (
    <section className="card p-5">
      <h2 className="text-2xl">Fees, taxes &amp; deposits</h2>
      <p className="mt-1 text-sm text-espresso/70">Only active charges appear in guest estimates. Taxes are calculated on accommodation plus fees. Refundable charges (deposits) are shown separately and not added to the total.</p>
      <form className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(e) => { e.preventDefault(); run(() => saveCharge({ ...form, id: form.id || undefined }), { onOk: () => setForm(blank) }); }}>
        <div><label className="label" htmlFor="c-type">Type</label><select id="c-type" className="input" value={form.type} onChange={(e) => set({ type: e.target.value })}>{Object.entries(TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div><label className="label" htmlFor="c-name">Name shown to guests</label><input id="c-name" className="input" required value={form.name} onChange={(e) => set({ name: e.target.value })} /></div>
        <div><label className="label" htmlFor="c-amount">{form.method === "PERCENT_OF_SUBTOTAL" ? "Percent (%)" : "Amount (₹)"}</label><input id="c-amount" className="input" required inputMode="decimal" value={form.amount} onChange={(e) => set({ amount: e.target.value })} /></div>
        <div><label className="label" htmlFor="c-method">Calculation</label><select id="c-method" className="input" value={form.method} onChange={(e) => set({ method: e.target.value })}>{Object.entries(METHODS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" className="h-5 w-5" checked={form.active} onChange={(e) => set({ active: e.target.checked })} />Active</label>
        <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" className="h-5 w-5" checked={form.refundable} onChange={(e) => set({ refundable: e.target.checked })} />Refundable</label>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-3"><button className="btn btn-primary" disabled={pending}>{form.id ? "Update charge" : "Add charge"}</button>{form.id && <button type="button" className="btn btn-outline" onClick={() => setForm(blank)}>Cancel</button>}</div>
      </form>
      <div className="mt-3"><NoticeBar notice={notice} /></div>
      {rows.length === 0 ? <div className="mt-4"><EmptyState title="No charges configured" /></div> : (
        <ul className="mt-4 divide-y divide-beige">
          {rows.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <span><strong>{c.name}</strong> · {TYPES[c.type as keyof typeof TYPES]} · {c.method === "PERCENT_OF_SUBTOTAL" ? `${Number(c.amount)}%` : `₹${Number(c.amount).toLocaleString("en-IN")}`} {METHODS[c.method as keyof typeof METHODS]}{c.refundable ? " · refundable" : ""}{!c.active && " · inactive"}</span>
              <span className="flex gap-2"><button className="btn btn-outline btn-sm" onClick={() => setForm({ ...c })}>Edit</button><button className="btn btn-outline btn-sm" onClick={() => setDel(c)}>Delete</button></span>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog open={!!del} danger title="Delete this charge?" confirmLabel="Delete" busy={pending} onCancel={() => setDel(null)} onConfirm={() => del && run(() => deleteCharge({ id: del.id }), { onOk: () => setDel(null) })}>
        <p>“{del?.name}” will no longer appear in estimates. Past enquiry quotes are unaffected.</p>
      </ConfirmDialog>
    </section>
  );
}

export function PolicyForm({ initial }: { initial: { includedGuests: number; advancePolicy: string; cancellationPolicy: string } }) {
  const [v, setV] = useState(initial);
  const { run, pending, notice } = useAction();
  return (
    <section className="card p-5">
      <h2 className="text-2xl">Guests &amp; policies</h2>
      <form className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); run(() => savePricingPolicy(v)); }}>
        <div className="max-w-xs"><label className="label" htmlFor="p-inc">Guests included in the nightly rate</label><input id="p-inc" type="number" min={1} max={50} className="input" value={v.includedGuests} onChange={(e) => setV({ ...v, includedGuests: Number(e.target.value) })} /><p className="mt-1 text-xs text-espresso/60">Extra-guest fees apply above this number.</p></div>
        <div><label className="label" htmlFor="p-adv">Advance payment requirement</label><textarea id="p-adv" rows={3} className="input" value={v.advancePolicy} onChange={(e) => setV({ ...v, advancePolicy: e.target.value })} /></div>
        <div><label className="label" htmlFor="p-can">Cancellation &amp; refund policy</label><textarea id="p-can" rows={3} className="input" value={v.cancellationPolicy} onChange={(e) => setV({ ...v, cancellationPolicy: e.target.value })} /></div>
        <button className="btn btn-primary" disabled={pending}>Save policies</button>
        <NoticeBar notice={notice} />
      </form>
    </section>
  );
}

export function FaqManager({ rows }: { rows: FaqRow[] }) {
  const blankF = { id: "", question: "", answer: "", published: true };
  const [form, setForm] = useState(blankF);
  const { run, pending, notice } = useAction();
  const move = (i: number, d: number) => { const ids = rows.map((r) => r.id); const j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; run(() => reorder({ entity: "faq", ids })); };
  return (
    <section className="card p-5">
      <h2 className="text-2xl">Pricing FAQs</h2>
      <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); run(() => saveFaq({ ...form, id: form.id || undefined }), { onOk: () => setForm(blankF) }); }}>
        <div><label className="label" htmlFor="f-q">Question</label><input id="f-q" className="input" required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></div>
        <div><label className="label" htmlFor="f-a">Answer</label><textarea id="f-a" rows={3} className="input" required value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />Published</label>
        <div className="flex gap-2"><button className="btn btn-primary" disabled={pending}>{form.id ? "Update FAQ" : "Add FAQ"}</button>{form.id && <button type="button" className="btn btn-outline" onClick={() => setForm(blankF)}>Cancel</button>}</div>
      </form>
      <div className="mt-3"><NoticeBar notice={notice} /></div>
      {rows.length === 0 ? <div className="mt-4"><EmptyState title="No FAQs yet" /></div> : (
        <ul className="mt-4 divide-y divide-beige">
          {rows.map((f, i) => (
            <li key={f.id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
              <span><strong>{f.question}</strong>{!f.published && " (hidden)"}<br /><span className="text-espresso/70">{f.answer}</span></span>
              <span className="flex gap-1"><button className="btn btn-outline btn-sm" onClick={() => move(i, -1)} aria-label="Move up" disabled={i === 0}>↑</button><button className="btn btn-outline btn-sm" onClick={() => move(i, 1)} aria-label="Move down" disabled={i === rows.length - 1}>↓</button><button className="btn btn-outline btn-sm" onClick={() => setForm({ id: f.id, question: f.question, answer: f.answer, published: f.published })}>Edit</button><button className="btn btn-outline btn-sm" onClick={() => run(() => deleteFaq({ id: f.id }))}>Delete</button></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
