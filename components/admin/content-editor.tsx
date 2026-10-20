"use client";

import { useState } from "react";
import { discardContentDraft, publishContent, saveContentDraft } from "@/actions/content";
import { NoticeBar, useAction } from "@/components/ui/feedback";

export interface GroupView {
  key: string; label: string; description: string; hasDraft: boolean;
  fields: { name: string; label: string; type: "text" | "textarea" | "image"; help?: string }[];
  values: Record<string, string>;
}

export function ContentEditor({ groups, images }: { groups: GroupView[]; images: { url: string; label: string }[] }) {
  return (
    <div className="space-y-4">
      <p className="rounded-xl bg-cream p-4 text-sm">Edit a block, <strong>save the draft</strong>, check the <a href="/admin/website-content/preview" target="_blank" className="text-terracotta underline">homepage preview</a>, then <strong>publish</strong> to make it live. Other pages (e.g. Pricing, The Space) show changes after publishing.</p>
      {groups.map((g) => <Group key={g.key} g={g} images={images} />)}
    </div>
  );
}

function Group({ g, images }: { g: GroupView; images: { url: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(g.values);
  const { run, pending, notice } = useAction();
  return (
    <section className="card">
      <button className="flex w-full items-center justify-between gap-3 p-5 text-left" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span><span className="text-2xl">{g.label}</span> {g.hasDraft && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">Draft pending</span>}<span className="block text-sm text-espresso/65">{g.description}</span></span>
        <span aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-beige p-5">
          {g.fields.map((f) => (
            <div key={f.name}>
              <label className="label" htmlFor={`${g.key}-${f.name}`}>{f.label}</label>
              {f.type === "textarea" ? <textarea id={`${g.key}-${f.name}`} rows={4} className="input" value={v[f.name] ?? ""} onChange={(e) => setV({ ...v, [f.name]: e.target.value })} />
                : f.type === "image" ? (
                  <select id={`${g.key}-${f.name}`} className="input" value={v[f.name] ?? ""} onChange={(e) => setV({ ...v, [f.name]: e.target.value })}>
                    <option value="">Automatic</option>{images.map((i) => <option key={i.url} value={i.url}>{i.label}</option>)}
                  </select>
                ) : <input id={`${g.key}-${f.name}`} className="input" value={v[f.name] ?? ""} onChange={(e) => setV({ ...v, [f.name]: e.target.value })} />}
              {f.help && <p className="mt-1 text-xs text-espresso/60">{f.help}</p>}
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-outline" disabled={pending} onClick={() => run(() => saveContentDraft({ key: g.key, values: v }))} data-testid={`save-${g.key}`}>Save draft</button>
            <button className="btn btn-primary" disabled={pending} data-testid={`publish-${g.key}`}
              onClick={() => run(async () => { const s = await saveContentDraft({ key: g.key, values: v }); return s.ok ? publishContent({ key: g.key }) : s; })}>Save &amp; publish</button>
            {g.hasDraft && <button className="btn btn-outline" disabled={pending} onClick={() => run(() => discardContentDraft({ key: g.key }))}>Discard draft</button>}
          </div>
          <NoticeBar notice={notice} />
        </div>
      )}
    </section>
  );
}
