import type { Metadata } from "next";
import { PageHero } from "@/components/public/page-hero";
import { getSettings } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy-policy" } };

export default async function PrivacyPage() {
  const s = await getSettings();
  const name = s?.propertyName ?? "Aavya’s Home";
  return (
    <>
      <PageHero title="Privacy Policy" />
      <article className="container-page max-w-3xl space-y-5 py-14 text-espresso/85 [&_h2]:mt-8 [&_h2]:text-3xl">
        <p>This policy explains how {name} handles the information you share through this website. It is a general template — the property owner should have it reviewed to confirm it matches their practice and local law.</p>
        <h2>Information we collect</h2>
        <p>When you send a booking enquiry we collect your name, email address, phone number, travel dates, number of guests and any requests you write. We also store the price estimate shown to you at that time.</p>
        <h2>How we use it</h2>
        <p>We use this information only to reply to your enquiry, discuss availability and prices, and manage your stay. Enquiries are visible to authorised staff. We do not sell your information.</p>
        <h2>Email and messaging</h2>
        <p>We may email you a confirmation and replies to your enquiry. If you contact us on WhatsApp, that conversation is subject to WhatsApp’s own privacy terms.</p>
        <h2>Storage and retention</h2>
        <p>Enquiries are stored in a secured database and kept for as long as needed to manage bookings and meet legal obligations.</p>
        <h2>Your choices</h2>
        <p>You can ask us to correct or delete your enquiry data{s?.contactEmail ? <> by writing to <a className="text-terracotta underline" href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a></> : " by contacting us through the details on the Contact page"}.</p>
      </article>
    </>
  );
}
