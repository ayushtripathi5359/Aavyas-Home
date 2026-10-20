import "server-only";
import { prisma } from "@/lib/db/prisma";
import { cachedQuery } from "@/lib/cache";

/** Public-facing data loaders. Everything is read from PostgreSQL; nothing is hardcoded. */

export const getSettings = cachedQuery(["site-settings"], () => prisma.propertySettings.findUnique({ where: { id: "singleton" } }));

export const getPublishedSpaces = cachedQuery(["site-spaces"], () =>
  prisma.propertySpace.findMany({
    where: { published: true, archived: false },
    orderBy: { sortOrder: "asc" },
    include: {
      images: { where: { published: true }, orderBy: { sortOrder: "asc" } },
      amenities: { include: { amenity: true }, where: { amenity: { enabled: true } } },
    },
  }));

export const getSpaceBySlug = cachedQuery(["site-space"], (slug: string) =>
  prisma.propertySpace.findFirst({
    where: { slug, published: true, archived: false },
    include: {
      images: { where: { published: true }, orderBy: { sortOrder: "asc" } },
      amenities: { include: { amenity: true }, where: { amenity: { enabled: true } } },
    },
  }));

export const getGalleryImages = cachedQuery(["site-gallery"], (opts?: { featuredOnly?: boolean; limit?: number }) =>
  prisma.galleryImage.findMany({
    where: { published: true, ...(opts?.featuredOnly ? { featured: true } : {}) },
    orderBy: { sortOrder: "asc" },
    take: opts?.limit,
  }));

export const getEnabledAmenities = cachedQuery(["site-amenities"], () =>
  prisma.amenity.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" } }));

export const getApprovedTestimonials = cachedQuery(["site-testimonials"], () =>
  prisma.testimonial.findMany({ where: { approved: true }, orderBy: { sortOrder: "asc" } }));

export const getNearbyPlaces = cachedQuery(["site-places"], () => prisma.nearbyPlace.findMany({ orderBy: { sortOrder: "asc" } }));

export const getPublishedFaqs = cachedQuery(["site-faqs"], () =>
  prisma.pricingFAQ.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } }));

/** Build a wa.me link. The default text never claims a reservation is confirmed. */
export function whatsappUrl(number: string | null | undefined, text: string): string | null {
  const digits = number?.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export const GENERIC_WA_TEXT = "Hello! I'd like to enquire about a stay at Aavya's Home.";

/** Public pricing-page reads. Cached; admin pricing edits bust the cache. Quotes are always computed fresh. */
export const getPricingSettings = cachedQuery(["site-pricing-settings"], () => prisma.pricingSettings.findUnique({ where: { id: "singleton" } }));
export const getActiveWeeklyRates = cachedQuery(["site-weekly-rates"], () => prisma.weeklyRate.findMany({ where: { active: true } }));
export const getActiveCharges = cachedQuery(["site-charges"], () => prisma.pricingCharge.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }));
