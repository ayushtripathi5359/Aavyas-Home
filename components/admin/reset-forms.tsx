"use client";

import Link from "next/link";
import { requestPasswordReset, resetPassword } from "@/actions/auth";
import { NoticeBar, useAction } from "@/components/ui/feedback";

export function ResetForm({ mode, token }: { mode: "request" | "reset"; token?: string }) {
  const { run, pending, notice } = useAction();
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        run(() => (mode === "request" ? requestPasswordReset({ email: fd.get("email") }) : resetPassword({ token, password: fd.get("password") })), { refresh: false });
      }}
    >
      {mode === "request" ? (
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" /></div>
      ) : (
        <div><label className="label" htmlFor="password">New password</label><input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} className="input" /><p className="mt-1 text-xs text-espresso/60">At least 10 characters, with letters and numbers.</p></div>
      )}
      <NoticeBar notice={notice} />
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Please wait…" : mode === "request" ? "Send reset link" : "Update password"}</button>
      <p className="text-center text-sm"><Link href="/admin/login" className="text-terracotta hover:underline">Back to sign in</Link></p>
    </form>
  );
}
