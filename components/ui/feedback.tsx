"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/action";

export type Notice = { kind: "ok" | "error"; text: string } | null;

export function NoticeBar({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return (
    <p
      role={notice.kind === "error" ? "alert" : "status"}
      className={`rounded-xl px-4 py-2.5 text-sm ${notice.kind === "error" ? "bg-red-50 text-red-800 border border-red-200" : "bg-olive/15 text-olive-dark border border-olive/30"}`}
    >
      {notice.text}
    </p>
  );
}

/** Runs a server action, shows its outcome and refreshes server data. */
export function useAction() {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, start] = useTransition();

  function run<T>(fn: () => Promise<ActionResult<T>>, opts?: { onOk?: (r: Extract<ActionResult<T>, { ok: true }>) => void; onFail?: (r: Extract<ActionResult<T>, { ok: false }>) => void; refresh?: boolean }) {
    setNotice(null);
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (r.message) setNotice({ kind: "ok", text: r.message });
        opts?.onOk?.(r);
        if (opts?.refresh !== false) router.refresh();
      } else {
        setNotice({ kind: "error", text: r.error });
        opts?.onFail?.(r);
      }
    });
  }
  return { run, pending, notice, setNotice };
}

export function Skeleton({ className = "h-6 w-full" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-beige bg-cream/50 px-6 py-10 text-center">
      <p className="font-serif text-xl">{title}</p>
      {children && <div className="mt-2 text-sm text-espresso/70">{children}</div>}
    </div>
  );
}
