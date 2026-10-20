import Link from "next/link";
import { CalendarRange, FileText, Image as ImageIcon, Mail } from "lucide-react";
import { PageHeader } from "@/components/admin/shell";
import { EnquiriesOverTime, StatusPie } from "@/components/admin/dashboard-charts";
import { EmptyState } from "@/components/ui/feedback";
import { requirePage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { addDays, todayInZone } from "@/lib/pricing/dates";
import { StatusBadge } from "@/components/admin/status-badge";

export const metadata = { title: "Dashboard" };

const LABEL = { NEW: "New", CONTACTED: "Contacted", CONFIRMED: "Confirmed", CANCELLED: "Cancelled", COMPLETED: "Completed" } as const;

export default async function Dashboard() {
  await requirePage("dashboard");
  const today = todayInZone();
  const from = addDays(today, -29);

  const [byStatus, recent, perDay] = await Promise.all([
    prisma.bookingEnquiry.groupBy({ by: ["status"], _count: true }),
    prisma.bookingEnquiry.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.$queryRaw<{ d: string; c: number }[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'Asia/Kolkata')::date, 'YYYY-MM-DD') AS d, count(*)::int AS c
      FROM "BookingEnquiry" WHERE ("createdAt" AT TIME ZONE 'Asia/Kolkata')::date >= ${from}::date GROUP BY 1`,
  ]);
  const count = (s: keyof typeof LABEL) => byStatus.find((b) => b.status === s)?._count ?? 0;
  const total = byStatus.reduce((n, b) => n + b._count, 0);
  const series = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(from, i);
    return { date, count: perDay.find((p) => p.d === date)?.c ?? 0 };
  });

  const stats = [
    { label: "Total enquiries", value: total },
    { label: "New", value: count("NEW") },
    { label: "Contacted", value: count("CONTACTED") },
    { label: "Confirmed", value: count("CONFIRMED") },
    { label: "Cancelled", value: count("CANCELLED") },
  ];
  const quick = [
    { href: "/admin/enquiries", label: "Manage enquiries", icon: Mail },
    { href: "/admin/pricing", label: "Edit pricing", icon: CalendarRange },
    { href: "/admin/gallery", label: "Upload photographs", icon: ImageIcon },
    { href: "/admin/website-content", label: "Update website content", icon: FileText },
  ];

  return (
    <>
      <PageHeader title="Dashboard" />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((s) => (
          <li key={s.label} className="card p-4"><p className="text-xs uppercase tracking-wide text-espresso/60">{s.label}</p><p className="mt-1 font-serif text-4xl" data-testid={`stat-${s.label}`}>{s.value}</p></li>
        ))}
      </ul>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quick.map((q) => (
          <li key={q.href}><Link href={q.href} className="card flex min-h-14 items-center gap-3 px-4 py-3 hover:border-terracotta"><q.icon className="h-5 w-5 text-terracotta" aria-hidden />{q.label}</Link></li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2"><h2 className="mb-3 text-2xl">Enquiries, last 30 days</h2><EnquiriesOverTime data={series} /></section>
        <section className="card p-5"><h2 className="mb-3 text-2xl">By status</h2><StatusPie data={(Object.keys(LABEL) as (keyof typeof LABEL)[]).map((k) => ({ name: LABEL[k], value: count(k) }))} /></section>
      </div>

      <section className="card mt-6 p-5">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-2xl">Recent enquiries</h2><Link className="text-sm text-terracotta hover:underline" href="/admin/enquiries">View all</Link></div>
        {recent.length === 0 ? <EmptyState title="No enquiries yet">They will appear here as guests submit the booking form.</EmptyState> : (
          <ul className="divide-y divide-beige">
            {recent.map((e) => (
              <li key={e.id}><Link href={`/admin/enquiries/${e.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-terracotta"><span><span className="font-medium">{e.guestName}</span> <span className="text-sm text-espresso/60">· {e.reference}</span></span><StatusBadge status={e.status} /></Link></li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
