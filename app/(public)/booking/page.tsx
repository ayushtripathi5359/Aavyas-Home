import type { Metadata } from "next";
import { CalendarCheck, MessageSquareText, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/public/page-header";
import { BookingForm } from "@/components/public/booking-form";
import { getSettings } from "@/lib/site";
import { isValidISODate, todayInZone } from "@/lib/pricing/dates";

export const metadata: Metadata = {
  title: "Booking Enquiry",
  description: "Send an enquiry to plan your stay at Aavya’s Home.",
  alternates: { canonical: "/booking" },
};

const POINTS = [
  { icon: CalendarCheck, title: "No commitment", text: "An enquiry does not reserve your dates." },
  { icon: MessageSquareText, title: "We reply personally", text: "We confirm availability and send you a quote." },
  { icon: ShieldCheck, title: "Your details stay private", text: "Used only to answer your enquiry." },
];

export default async function BookingPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const settings = await getSettings();
  const guests = Number(sp.guests);
  return (
    <>
      <PageHeader eyebrow="BOOK YOUR STAY" title="Send an enquiry" photo={{ url: "/photos/img_3382.jpg", position: "50% 58%" }}>
        <p>Tell us your dates and who is coming. We’ll get back to you with availability and a quote.</p>
      </PageHeader>
      <div className="mx-auto max-w-[80rem] px-4 pb-16 pt-6 sm:px-8">
        <ul className="mb-10 grid gap-4 sm:grid-cols-3" aria-label="What to expect">
          {POINTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-beige/60 text-terracotta"><Icon className="h-[1.1rem] w-[1.1rem]" aria-hidden /></span>
              <span><span className="block font-serif text-[1.1rem] leading-tight">{title}</span><span className="mt-0.5 block text-[0.8rem] text-espresso/70">{text}</span></span>
            </li>
          ))}
        </ul>
        <BookingForm
          today={todayInZone()}
          maxGuests={settings?.maxGuests ?? 6}
          whatsapp={settings?.whatsappNumber?.replace(/\D/g, "") || null}
          propertyName={settings?.propertyName ?? "Aavya's Home"}
          initial={{
            checkIn: isValidISODate(sp.checkIn) ? sp.checkIn : undefined,
            checkOut: isValidISODate(sp.checkOut) ? sp.checkOut : undefined,
            guests: Number.isInteger(guests) && guests > 0 ? guests : undefined,
          }}
        />
      </div>
    </>
  );
}
