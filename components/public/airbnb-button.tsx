import { ExternalLink } from "lucide-react";

/** Opens the owner's Airbnb listing in a new tab. Renders nothing when no listing URL is configured. */
export function AirbnbButton({ href, className = "btn btn-primary", children = "Book on Airbnb" }: { href: string | null | undefined; className?: string; children?: React.ReactNode }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} data-testid="airbnb-link">
      {children}
      <ExternalLink className="h-4 w-4" aria-hidden />
      <span className="sr-only"> (opens Airbnb in a new tab)</span>
    </a>
  );
}

/** Soft notice used above the pricing calculator and booking form. */
export function AirbnbNotice({ href }: { href: string | null | undefined }) {
  if (!href) return null;
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-terracotta/30 bg-terracotta/5 px-5 py-4 sm:flex-row sm:items-center">
      <div>
        <p className="font-serif text-[1.25rem] leading-tight">Booking is currently through Airbnb</p>
        <p className="mt-0.5 text-[0.82rem] text-espresso/75">Check live availability and book your stay on our Airbnb listing. You can still send an enquiry here with any questions.</p>
      </div>
      <AirbnbButton href={href} className="btn btn-primary shrink-0" />
    </div>
  );
}
