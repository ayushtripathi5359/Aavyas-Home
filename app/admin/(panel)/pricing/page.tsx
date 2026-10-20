import { PageHeader } from "@/components/admin/shell";
import { ModeCard } from "@/components/admin/pricing/mode-card";
import { WeeklyEditor } from "@/components/admin/pricing/weekly-editor";
import { DailyEditor } from "@/components/admin/pricing/daily-editor";
import { OverridesManager } from "@/components/admin/pricing/overrides-manager";
import { ChargesManager, FaqManager, PolicyForm } from "@/components/admin/pricing/charges-manager";
import { Tabs } from "@/components/ui/tabs";
import { requirePage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getWeeklyRatesForAdmin } from "@/lib/pricing/service";
import { dbDateToISO, isoToDbDate, todayInZone } from "@/lib/pricing/dates";

export const metadata = { title: "Pricing" };

export default async function AdminPricing() {
  await requirePage("pricing");
  const [settings, weekly, overrides, charges, faqs, dailyFuture, updatedBy] = await Promise.all([
    prisma.pricingSettings.findUnique({ where: { id: "singleton" } }),
    getWeeklyRatesForAdmin(),
    prisma.datePriceOverride.findMany({ orderBy: { startDate: "asc" } }),
    prisma.pricingCharge.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.pricingFAQ.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.dailyRate.count({ where: { date: { gte: isoToDbDate(todayInZone()) } } }),
    prisma.auditLog.findFirst({ where: { action: "PRICING_MODE_CHANGED" }, orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true } } } }),
  ]);
  const mode = settings?.activeMode ?? "WEEKLY";
  const overrideRows = overrides.map((o) => ({ id: o.id, name: o.name, startDate: dbDateToISO(o.startDate), endDate: dbDateToISO(o.endDate), price: o.price.toFixed(2), active: o.active, notes: o.notes }));

  return (
    <>
      <PageHeader title="Pricing">
        <p className="rounded-full bg-terracotta px-4 py-1.5 text-sm text-white" data-testid="active-mode-label">Active: {mode === "WEEKLY" ? "Weekly pricing" : "Daily manual pricing"}</p>
      </PageHeader>
      <div className="space-y-6">
        <ModeCard active={mode} weekly={weekly} dailyFutureCount={dailyFuture}
          updatedAt={updatedBy ? `${updatedBy.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} by ${updatedBy.actor?.name ?? "unknown"}` : null} />
        <Tabs initial={mode === "DAILY" ? "daily" : "weekly"} tabs={[
          { id: "weekly", label: "Weekly rates", panel: <WeeklyEditor initial={weekly.map((w) => ({ weekday: w.weekday, price: w.price, active: w.active }))} overrides={overrideRows.filter((o) => o.active).map((o) => ({ id: o.id, name: o.name, startDate: o.startDate, endDate: o.endDate, price: o.price }))} modeActive={mode === "WEEKLY"} /> },
          { id: "overrides", label: "Date overrides", panel: <OverridesManager rows={overrideRows} modeActive={mode === "WEEKLY"} /> },
          { id: "daily", label: "Daily rates", panel: <DailyEditor modeActive={mode === "DAILY"} /> },
          { id: "charges", label: "Fees & taxes", panel: <ChargesManager rows={charges.map((c) => ({ id: c.id, type: c.type, name: c.name, amount: c.amount.toFixed(2), method: c.method, active: c.active, refundable: c.refundable }))} /> },
          { id: "policies", label: "Policies & FAQs", panel: <div className="space-y-6"><PolicyForm initial={{ includedGuests: settings?.includedGuests ?? 2, advancePolicy: settings?.advancePolicy ?? "", cancellationPolicy: settings?.cancellationPolicy ?? "" }} /><FaqManager rows={faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer, published: f.published }))} /></div> },
        ]} />
      </div>
    </>
  );
}
