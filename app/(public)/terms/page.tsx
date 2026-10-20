import type { Metadata } from "next";
import { PageHero } from "@/components/public/page-hero";
import { prisma } from "@/lib/db/prisma";
import { getSettings } from "@/lib/site";

export const metadata: Metadata = { title: "Terms & Conditions", alternates: { canonical: "/terms" } };

export default async function TermsPage() {
  const [s, pricing] = await Promise.all([getSettings(), prisma.pricingSettings.findUnique({ where: { id: "singleton" } })]);
  return (
    <>
      <PageHero title="Terms & Conditions" />
      <article className="container-page max-w-3xl space-y-5 py-14 text-espresso/85 [&_h2]:mt-8 [&_h2]:text-3xl">
        <p>These terms are a general template and should be reviewed by the property owner before reliance.</p>
        <h2>Enquiries and bookings</h2>
        <p>Submitting the enquiry form does not reserve or confirm any dates. A stay is confirmed only when {s?.propertyName ?? "the property"} tells you so directly.</p>
        <h2>Prices</h2>
        <p>Prices shown on this website are estimates for the dates you select and may change until your stay is confirmed. Dates without a published price require a custom quote.</p>
        {pricing?.advancePolicy && <><h2>Advance payment</h2><p className="whitespace-pre-line">{pricing.advancePolicy}</p></>}
        {pricing?.cancellationPolicy && <><h2>Cancellation and refunds</h2><p className="whitespace-pre-line">{pricing.cancellationPolicy}</p></>}
        {(s?.checkInTime || s?.checkOutTime) && <><h2>Check-in and check-out</h2><p>Check-in: {s?.checkInTime ?? "to be confirmed"}. Check-out: {s?.checkOutTime ?? "to be confirmed"}.</p></>}
        {s?.houseRules && <><h2>House rules</h2><p className="whitespace-pre-line">{s.houseRules}</p></>}
      </article>
    </>
  );
}
