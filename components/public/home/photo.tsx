import Image from "next/image";
import { objectPosition, zoomFor } from "@/lib/photo-config";

export interface PhotoRef { url: string; altText: string }

/** Fills its (relatively positioned) parent. Crop focus comes from the central photo config. */
export function Photo({ img, sizes, priority, className = "" }: { img: PhotoRef | null; sizes: string; priority?: boolean; className?: string }) {
  if (!img) return <div className={`absolute inset-0 bg-cream ${className}`} aria-hidden />;
  return (
    <Image
      src={img.url}
      alt={img.altText}
      fill
      sizes={sizes}
      priority={priority}
      className={`object-cover ${className}`}
      style={{ objectPosition: objectPosition(img.url), ...(zoomFor(img.url) > 1 ? { transform: `scale(${zoomFor(img.url)})`, transformOrigin: objectPosition(img.url) } : {}) }}
    />
  );
}
