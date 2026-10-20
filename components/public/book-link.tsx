import Link from "next/link";

/**
 * A booking / pricing call-to-action. While an Airbnb listing URL is configured (Admin → Contact settings) it opens
 * that listing in a new tab; otherwise it links to the on-site page given in `fallback`.
 */
export function BookLink({ airbnbUrl, fallback, className, children }: { airbnbUrl?: string | null; fallback: string; className?: string; children: React.ReactNode }) {
  if (airbnbUrl) {
    return (
      <a href={airbnbUrl} target="_blank" rel="noopener noreferrer" className={className} data-airbnb="true">
        {children}
        <span className="sr-only"> (opens Airbnb in a new tab)</span>
      </a>
    );
  }
  return <Link href={fallback} className={className}>{children}</Link>;
}
