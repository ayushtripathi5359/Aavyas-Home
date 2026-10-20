"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface GalleryItem {
  id: string;
  url: string;
  altText: string;
  caption: string | null;
  category: string;
}

const TABS: { value: string; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "LIVING_ROOM", label: "Living Room" },
  { value: "BEDROOM", label: "Bedroom" },
  { value: "KITCHEN", label: "Kitchen" },
  { value: "BALCONY", label: "Balcony" },
  { value: "WASHROOM", label: "Washroom" },
];

export function GalleryGrid({ images, filters = true }: { images: GalleryItem[]; filters?: boolean }) {
  const [tab, setTab] = useState("ALL");
  const [active, setActive] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const visible = tab === "ALL" ? images : images.filter((i) => i.category === tab);
  const present = TABS.filter((t) => t.value === "ALL" || images.some((i) => i.category === t.value));

  const close = useCallback(() => setActive(null), []);
  const step = useCallback((d: number) => setActive((i) => (i === null ? i : (i + d + visible.length) % visible.length)), [visible.length]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (active !== null && !el.open) el.showModal();
    if (active === null && el.open) {
      el.close();
      opener.current?.focus();
    }
  }, [active]);

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, step]);

  if (images.length === 0) return <p className="text-espresso/70">Photographs will appear here soon.</p>;
  const current = active !== null ? visible[active] : null;

  return (
    <div>
      {filters && (
        <div role="tablist" aria-label="Filter photographs" className="mb-8 flex gap-x-7 gap-y-2 overflow-x-auto border-b border-beige">
          {present.map((t) => {
            const count = t.value === "ALL" ? images.length : images.filter((i) => i.category === t.value).length;
            return (
              <button
                key={t.value}
                role="tab"
                aria-selected={tab === t.value}
                onClick={() => setTab(t.value)}
                className={`-mb-px shrink-0 border-b-2 pb-2.5 text-[0.85rem] transition-colors ${tab === t.value ? "border-terracotta text-terracotta" : "border-transparent text-espresso/70 hover:text-espresso"}`}
              >
                {t.label} <span className="ml-0.5 text-[0.7rem] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      )}
      <ul className="columns-2 gap-3 sm:gap-4 md:columns-3 [&>li]:mb-3 sm:[&>li]:mb-4" data-testid="gallery-grid">
        {visible.map((img, i) => (
          <li key={img.id} className="break-inside-avoid">
            <button
              type="button"
              className="group relative block w-full overflow-hidden rounded-xl bg-cream"
              onClick={(e) => {
                opener.current = e.currentTarget;
                setActive(i);
              }}
              aria-label={`Open photo: ${img.altText}`}
            >
              <Image
                src={img.url}
                alt={img.altText}
                width={900}
                height={i % 3 === 0 ? 1200 : 900}
                sizes="(min-width:768px) 33vw, 50vw"
                className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 pb-2.5 pt-8 text-left text-[0.75rem] text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">{img.caption || img.altText}</span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        onClose={close}
        onClick={(e) => e.target === dialog.current && close()}
        aria-label="Photo viewer"
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-espresso/90"
      >
        {current && (
          <div
            className="relative flex h-full w-full items-center justify-center p-4 sm:p-10"
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
              touchX.current = null;
            }}
          >
            <button className="absolute right-3 top-3 z-10 rounded-full bg-ivory p-3" onClick={close} aria-label="Close viewer"><X className="h-5 w-5" /></button>
            {visible.length > 1 && (
              <>
                <button className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-ivory p-3" onClick={() => step(-1)} aria-label="Previous photo"><ChevronLeft className="h-5 w-5" /></button>
                <button className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-ivory p-3" onClick={() => step(1)} aria-label="Next photo"><ChevronRight className="h-5 w-5" /></button>
              </>
            )}
            <figure className="flex max-h-full max-w-5xl flex-col items-center">
              <Image src={current.url} alt={current.altText} width={1600} height={1600} sizes="100vw" className="max-h-[80dvh] w-auto rounded-xl object-contain" priority />
              <figcaption className="mt-3 text-center text-sm text-ivory">
                {current.caption || current.altText}
                <span className="ml-2 text-ivory/60" aria-live="polite">{(active ?? 0) + 1} / {visible.length}</span>
              </figcaption>
            </figure>
          </div>
        )}
      </dialog>
    </div>
  );
}
