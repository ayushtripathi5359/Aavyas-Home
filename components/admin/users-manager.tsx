"use client";

import { useState } from "react";
import { createAdminUser, updateAdminUser } from "@/actions/auth";
import { NoticeBar, useAction } from "@/components/ui/feedback";

export interface UserRow { id: string; name: string; email: string; role: string; active: boolean; self: boolean }

export function UsersManager({ users }: { users: UserRow[] }) {
  const { run, pending, notice } = useAction();
  const [form, setForm] = useState({ name: "", email: "", role: "PROPERTY_MANAGER", password: "" });
  const [pw, setPw] = useState<Record<string, string>>({});
  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="text-2xl">Add an admin user</h2>
        <p className="mt-1 text-sm text-espresso/70">Accounts are created here by a Super Admin only. There is no public sign-up.</p>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); run(() => createAdminUser(form), { onOk: () => setForm({ name: "", email: "", role: "PROPERTY_MANAGER", password: "" }) }); }}>
          <div><label className="label" htmlFor="u-name">Name</label><input id="u-name" className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label" htmlFor="u-email">Email</label><input id="u-email" type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label" htmlFor="u-role">Role</label><select id="u-role" className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="PROPERTY_MANAGER">Property Manager</option><option value="SUPER_ADMIN">Super Admin</option></select></div>
          <div><label className="label" htmlFor="u-pw">Temporary password</label><input id="u-pw" type="password" autoComplete="new-password" className="input" required minLength={10} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div className="sm:col-span-2"><button className="btn btn-primary" disabled={pending}>Create user</button></div>
        </form>
        <div className="mt-3"><NoticeBar notice={notice} /></div>
      </section>
      <section className="card overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-beige bg-cream/60 text-xs uppercase tracking-wide text-espresso/70"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Reset password</th></tr></thead>
          <tbody className="divide-y divide-beige">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3"><p className="font-medium">{u.name}{u.self && " (you)"}</p><p className="text-espresso/60">{u.email}</p></td>
                <td className="px-4 py-3"><select aria-label={`Role for ${u.name}`} className="input min-h-9 py-1" value={u.role} disabled={u.self || pending} onChange={(e) => run(() => updateAdminUser({ id: u.id, role: e.target.value }))}><option value="PROPERTY_MANAGER">Property Manager</option><option value="SUPER_ADMIN">Super Admin</option></select></td>
                <td className="px-4 py-3"><button className="btn btn-outline btn-sm" disabled={u.self || pending} onClick={() => run(() => updateAdminUser({ id: u.id, active: !u.active }))}>{u.active ? "Deactivate" : "Reactivate"}</button></td>
                <td className="px-4 py-3"><div className="flex gap-2"><input aria-label={`New password for ${u.name}`} type="password" autoComplete="new-password" className="input min-h-9 max-w-44 py-1" value={pw[u.id] ?? ""} onChange={(e) => setPw({ ...pw, [u.id]: e.target.value })} /><button className="btn btn-outline btn-sm" disabled={!pw[u.id] || pending} onClick={() => run(() => updateAdminUser({ id: u.id, newPassword: pw[u.id] }), { onOk: () => setPw({ ...pw, [u.id]: "" }) })}>Set</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
