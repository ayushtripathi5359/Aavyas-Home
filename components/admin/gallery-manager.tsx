"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { deleteImage, reorder, updateImage } from "@/actions/admin";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, NoticeBar, useAction, type Notice } from "@/components/ui/feedback";
import { CATEGORY_LABELS } from "@/lib/validation/schemas";

export interface ImageRow { id: string; url: string; title: string; altText: string; caption: string; category: string; spaceId: string; featured: boolean; published: boolean }

async function upload(files: FileList | File[], replaceId?: string): Promise<{ ok: boolean; text: string }> {
  const fd = new FormData();
  for (const f of Array.from(files)) fd.append("files", f);
  if (replaceId) fd.set("replaceId", replaceId);
  const res = await fetch("/api/admin/gallery", { method: "POST", body: fd });
  const j = await res.json().catch(() => ({ ok: false, error: "Upload failed." }));
  if (!j.ok) return { ok: false, text: j.error ?? j.results?.find((r: { ok: boolean }) => !r.ok)?.error ?? "Upload failed." };
  const failed = (j.results ?? []).filter((r: { ok: boolean }) => !r.ok);
  return { ok: true, text: failed.length ? `Uploaded with ${failed.length} error(s): ${failed[0].error}` : "Uploaded. Add alt text, then publish." };
}

export function GalleryManager({ images, spaces }: { images: ImageRow[]; spaces: { id: string; name: string }[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const { run } = useAction();

  async function doUpload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setNotice(null);
    const r = await upload(files);
    setNotice({ kind: r.ok ? "ok" : "error", text: r.text });
    setBusy(false);
    if (input.current) input.current.value = "";
    router.refresh();
  }

  const move = (i: number, d: number) => { const ids = images.map((x) => x.id); const j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; run(() => reorder({ entity: "image", ids })); };

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="text-2xl">Upload photographs</h2>
        <p className="mt-1 text-sm text-espresso/70">JPEG, PNG or WebP up to 10 MB each. New uploads are saved as unpublished until you add alt text and publish.</p>
        <label className="btn btn-primary mt-4 cursor-pointer">
          <Upload className="h-4 w-4" aria-hidden />{busy ? "Uploading…" : "Choose images"}
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={busy} onChange={(e) => doUpload(e.target.files)} data-testid="upload-input" />
        </label>
        <div className="mt-3"><NoticeBar notice={notice} /></div>
      </section>

      {images.length === 0 ? <EmptyState title="No photographs yet">Upload your first image above.</EmptyState> : (
        <ul className="space-y-4">
          {images.map((img, i) => <ImageCard key={img.id + img.url} img={img} index={i} count={images.length} spaces={spaces} onMove={move} />)}
        </ul>
      )}
    </div>
  );
}

function ImageCard({ img, index, count, spaces, onMove }: { img: ImageRow; index: number; count: number; spaces: { id: string; name: string }[]; onMove: (i: number, d: number) => void }) {
  const router = useRouter();
  const [v, setV] = useState(img);
  const [del, setDel] = useState(false);
  const { run, pending, notice, setNotice } = useAction();
  const set = (p: Partial<ImageRow>) => setV((x) => ({ ...x, ...p }));
  const dirty = JSON.stringify(v) !== JSON.stringify(img);

  async function replace(file?: File) {
    if (!file) return;
    const r = await upload([file], img.id);
    setNotice({ kind: r.ok ? "ok" : "error", text: r.ok ? "Image replaced." : r.text });
    router.refresh();
  }

  return (
    <li className="card grid gap-4 p-4 sm:grid-cols-[10rem_1fr]" data-testid="gallery-item">
      <div className="space-y-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-cream"><Image src={img.url} alt={img.altText} fill sizes="160px" className="object-cover" /></div>
        <div className="flex flex-wrap gap-1">
          <button className="btn btn-outline btn-sm" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label="Move earlier">↑</button>
          <button className="btn btn-outline btn-sm" onClick={() => onMove(index, 1)} disabled={index === count - 1} aria-label="Move later">↓</button>
        </div>
      </div>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); run(() => updateImage({ ...v })); }}>
        <div><label className="label" htmlFor={`t-${img.id}`}>Title</label><input id={`t-${img.id}`} className="input" value={v.title} onChange={(e) => set({ title: e.target.value })} /></div>
        <div><label className="label" htmlFor={`c-${img.id}`}>Category</label><select id={`c-${img.id}`} className="input" value={v.category} onChange={(e) => set({ category: e.target.value })}>{Object.entries(CATEGORY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div className="sm:col-span-2"><label className="label" htmlFor={`a-${img.id}`}>Alt text (required)</label><input id={`a-${img.id}`} className="input" required value={v.altText} onChange={(e) => set({ altText: e.target.value })} /></div>
        <div><label className="label" htmlFor={`cap-${img.id}`}>Caption</label><input id={`cap-${img.id}`} className="input" value={v.caption} onChange={(e) => set({ caption: e.target.value })} /></div>
        <div><label className="label" htmlFor={`s-${img.id}`}>Space</label><select id={`s-${img.id}`} className="input" value={v.spaceId} onChange={(e) => set({ spaceId: e.target.value })}><option value="">None</option>{spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={v.featured} onChange={(e) => set({ featured: e.target.checked })} />Featured</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={v.published} onChange={(e) => set({ published: e.target.checked })} data-testid="published" />Published</label>
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button className="btn btn-primary btn-sm" disabled={pending || !dirty} data-testid="save-image">Save</button>
          <label className="btn btn-outline btn-sm cursor-pointer">Replace file<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => replace(e.target.files?.[0])} /></label>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setDel(true)}>Delete</button>
        </div>
        <div className="sm:col-span-2"><NoticeBar notice={notice} /></div>
      </form>
      <ConfirmDialog open={del} danger title="Delete this photograph?" confirmLabel="Delete" busy={pending} onCancel={() => setDel(false)} onConfirm={() => run(() => deleteImage({ id: img.id }), { onOk: () => setDel(false) })}>
        <p>The image is removed from the gallery, any space cover and homepage content that uses it. This cannot be undone.</p>
      </ConfirmDialog>
    </li>
  );
}
