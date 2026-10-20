import Link from "next/link";
import { PageHeader } from "@/components/admin/shell";
import { EmptyState } from "@/components/ui/feedback";
import { requirePage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Audit logs" };
const SIZE = 30;

export default async function AuditLogs({ searchParams }: { searchParams: Promise<{ page?: string; action?: string }> }) {
  await requirePage("audit-logs");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = sp.action ? { action: { contains: sp.action.toUpperCase() } } : {};
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * SIZE, take: SIZE, include: { actor: { select: { name: true } } } }),
    prisma.auditLog.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / SIZE));
  return (
    <>
      <PageHeader title="Audit logs" />
      <form className="card mb-4 flex flex-wrap items-end gap-3 p-4" role="search"><div><label className="label" htmlFor="action">Filter by action</label><input id="action" name="action" defaultValue={sp.action} className="input" placeholder="e.g. PRICING" /></div><button className="btn btn-primary btn-sm">Filter</button></form>
      {rows.length === 0 ? <EmptyState title="No log entries" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-beige bg-cream/60 text-xs uppercase tracking-wide text-espresso/70"><tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Record</th><th className="px-4 py-3">Detail</th></tr></thead>
            <tbody className="divide-y divide-beige">
              {rows.map((r) => (
                <tr key={r.id}><td className="whitespace-nowrap px-4 py-2.5">{r.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td><td className="px-4 py-2.5">{r.actor?.name ?? "—"}</td><td className="px-4 py-2.5 font-mono text-xs">{r.action}</td><td className="px-4 py-2.5 text-espresso/70">{r.entity}{r.entityId ? ` · ${r.entityId.slice(0, 8)}` : ""}</td><td className="px-4 py-2.5 text-espresso/70">{r.detail}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination"><span>{total} entries · page {page} of {pages}</span><span className="flex gap-2">{page > 1 && <Link className="btn btn-outline btn-sm" href={`?page=${page - 1}${sp.action ? `&action=${sp.action}` : ""}`}>Previous</Link>}{page < pages && <Link className="btn btn-outline btn-sm" href={`?page=${page + 1}${sp.action ? `&action=${sp.action}` : ""}`}>Next</Link>}</span></nav>
    </>
  );
}
