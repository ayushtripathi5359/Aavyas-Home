import "server-only";
import { prisma } from "@/lib/db/prisma";

/** Public-facing data loaders. Everything is read from PostgreSQL; nothing is hardcoded. */

export const getSettings = () => prisma.propertySettings.findUnique({ where: { id: "singleton" } });

export const getPublishedSpaces = () =>
  prisma.propertySpace.findMany({
    where: { published: true, archived: false },
    orderBy: { sortOrder: "asc" },
    include: {
      images: { where: { published: true }, orderBy: { sortOrder: "asc" } },
      amenities: { include: { amenity: true }, where: { amenity: { enabled: true } } },
    },
  });

export const getSpaceBySlug = (slug: string) =>
  prisma.propertySpace.findFirst({
    where: { slug, published: true, archived: false },
    include: {
      images: { where: { published: true }, orderBy: { sortOrder: "asc" } },
      amenities: { include: { amenity: true }, where: { amenity: { enabled: true } } },
    },
  });

export const getGalleryImages = (opts?: { featuredOnly?: boolean; limit?: number }) =>
  prisma.galleryImage.findMany({
    where: { published: true, ...(opts?.featuredOnly ? { featured: true } : {}) },
    orderBy: { sortOrder: "asc" },
    take: opts?.limit,
  });

export const getEnabledAmenities = () =>
  prisma.amenity.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" } });

export const getApprovedTestimonials = () =>
  prisma.testimonial.findMany({ where: { approved: true }, orderBy: { sortOrder: "asc" } });

export const getNearbyPlaces = () => prisma.nearbyPlace.findMany({ orderBy: { sortOrder: "asc" } });

export const getPublishedFaqs = () =>
  prisma.pricingFAQ.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } });

/** Build a wa.me link. The default text never claims a reservation is confirmed. */
export function whatsappUrl(number: string | null | undefined, text: string): string | null {
  const digits = number?.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export const GENERIC_WA_TEXT = "Hello! I'd like to enquire about a stay at Aavya's Home.";
