import Image from "next/image";
import { Fragment } from "react";

/** Renders text where *wrapped* segments are terracotta. */
export function Hl({ text }: { text: string }) {
  return (
    <>
      {text.split("|").map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <>{" "}<br /></>}
          {line.split(/(\*[^*]+\*)/g).map((part, i) =>
            part.startsWith("*") && part.endsWith("*") ? (
              <span key={i} className="text-terracotta">{part.slice(1, -1)}</span>
            ) : (
              <Fragment key={i}>{part}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </>
  );
}

/** Roof / house-inspired mark. */
export function RoofMark({ className = "h-7 w-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 17 24 3l21 14" />
      <path d="M9 17 24 7l15 10" opacity=".55" />
      <path d="M19 26v-7h10v7" />
    </svg>
  );
}

/** The Aavya’s Home logo (public/logo-v2.png, 1466×624). `light` renders a white version for dark photographs. */
export function BrandLogo({ name, light, className = "h-[4.5rem] w-auto" }: { name: string; light?: boolean; tagline?: boolean; className?: string }) {
  return (
    <Image
      src="/logo-v2.png"
      alt={name}
      width={1466}
      height={624}
      priority
      className={`${className} ${light ? "brightness-0 invert" : ""}`}
    />
  );
}

type IconProps = { className?: string };

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".6" fill="currentColor" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z" />
    </svg>
  );
}
