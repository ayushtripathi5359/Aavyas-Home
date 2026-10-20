import Link from "next/link";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/admin/shell";
import { StatusBadge, STATUS_LABEL } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/ui/feedback";
import { requirePage } from "@/lib/auth/guards";
import { listEnquiries, type EnquiryParams } from "@/lib/enquiry-query";
import { dbDateToISO } from "@/lib/pricing/dates";
import { formatMoney } from "@/lib/pricing/engine";

export const metadata = { title: "Enquiries" };

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<EnquiryParams> }) {
  await requirePage("enquiries");
  const sp = await searchParams;
  const { rows, total, page, pages } = await listEnquiries(sp);

  const qs = (over: Partial<EnquiryParams>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...over })) if (v) p.set(k, String(v));
    return p.toString();
  };
  const sortLink = (key: string, label: string) => {
    const active = (sp.sort ?? "createdAt") === key;
    const dir = active && sp.dir !== "asc" ? "asc" : "desc";
    return <Link href={`?${qs({ sort: key, dir, page: "1" })}`} className="hover:text-terracotta" aria-label={`Sort by ${label}`}>{label}{active ? (sp.dir === "asc" ? " ↑" : " ↓") : ""}</Link>;
  };

  return (
    <>
      <PageHeader title="Enquiries">
        <a href={`/admin/enquiries/export?${qs({ page: undefined })}`} className="btn btn-outline btn-sm"><Download className="h-4 w-4" aria-hidden />Export CSV</a>
      </PageHeader>

      <form method="get" className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5" role="search">
        <div className="lg:col-span-2"><label className="label" htmlFor="q">Search</label><input id="q" name="q" defaultValue={sp.q} placeholder="Reference, name, email, phone" className="input" /></div>
        <div><label className="label" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={sp.status ?? ""} className="input"><option value="">All</option>{Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div><label className="label" htmlFor="from">Check-in from</label><input id="from" name="from" type="date" defaultValue={sp.from} className="input" /></div>
        <div><label className="label" htmlFor="to">Check-in to</label><input id="to" name="to" type="date" defaultValue={sp.to} className="input" /></div>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-5"><button className="btn btn-primary btn-sm">Apply filters</button><Link href="/admin/enquiries" className="btn btn-outline btn-sm">Reset</Link></div>
      </form>

      {rows.length === 0 ? <EmptyState title="No enquiries found">Try changing the filters, or wait for guests to submit the booking form.</EmptyState> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b border-beige bg-cream/60 text-xs uppercase tracking-wide text-espresso/70">
              <tr>
                <th scope="col" className="px-4 py-3">Reference</th>
                <th scope="col" className="px-4 py-3">{sortLink("guestName", "Guest")}</th>
                <th scope="col" className="px-4 py-3">Contact</th>
                <th scope="col" className="px-4 py-3">{sortLink("checkIn", "Stay")}</th>
                <th scope="col" className="px-4 py-3">Guests</th>
                <th scope="col" className="px-4 py-3">{sortLink("quotedTotal", "Quoted")}</th>
                <th scope="col" className="px-4 py-3">{sortLink("createdAt", "Submitted")}</th>
                <th scope="col" className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige">
              {rows.map((e) => (
                <tr key={e.id} className="hover:bg-cream/40">
                  <td className="px-4 py-3 font-medium"><Link href={`/admin/enquiries/${e.id}`} className="text-terracotta hover:underline">{e.reference}</Link></td>
                  <td className="px-4 py-3">{e.guestName}</td>
                  <td className="px-4 py-3"><div>{e.email}</div><div className="text-espresso/60">{e.phone}</div></td>
                  <td className="px-4 py-3 whitespace-nowrap">{dbDateToISO(e.checkIn)} → {dbDateToISO(e.checkOut)}<div className="text-espresso/60">{e.nights} night{e.nights === 1 ? "" : "s"}</div></td>
                  <td className="px-4 py-3">{e.guests}</td>
                  <td className="px-4 py-3">{e.quotedTotal ? formatMoney(e.quotedTotal.toFixed(2), e.currency) : <span className="text-espresso/50">Custom quote</span>}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{e.createdAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
                  <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
        <span>{total} enquir{total === 1 ? "y" : "ies"} · page {page} of {pages}</span>
        <span className="flex gap-2">
          {page > 1 && <Link className="btn btn-outline btn-sm" href={`?${qs({ page: String(page - 1) })}`}>Previous</Link>}
          {page < pages && <Link className="btn btn-outline btn-sm" href={`?${qs({ page: String(page + 1) })}`}>Next</Link>}
        </span>
      </nav>
    </>
  );
}
