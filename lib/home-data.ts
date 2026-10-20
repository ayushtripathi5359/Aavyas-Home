import "server-only";
import { getAllContent } from "@/lib/content";
import {
  getApprovedTestimonials, getEnabledAmenities, getGalleryImages, getNearbyPlaces, getPublishedSpaces, getSettings,
} from "@/lib/site";
import type { HomeData } from "@/components/public/home";

export async function loadHomeData(mode: "published" | "draft" = "published"): Promise<HomeData> {
  const [content, settings, spaces, images, amenities, testimonials, places] = await Promise.all([
    getAllContent(mode), getSettings(), getPublishedSpaces(), getGalleryImages(), getEnabledAmenities(), getApprovedTestimonials(), getNearbyPlaces(),
  ]);
  return { content, settings, spaces, images, amenities, testimonials, places };
}
