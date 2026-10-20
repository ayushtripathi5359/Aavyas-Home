"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { audit } from "@/lib/audit";
import { fail, guarded, ok } from "@/lib/action";
import { removeStored } from "@/lib/storage";
import {
  amenitySchema,
  imageMetaSchema,
  nearbyPlaceSchema,
  settingsSchema,
  spaceSchema,
  testimonialSchema,
} from "@/lib/validation/schemas";
import type { AdminArea } from "@/lib/auth/guards";

const refreshPublic = () => revalidatePath("/", "layout");
const idSchema = z.object({ id: z.string().min(5).max(40) });

// ───────── Gallery ─────────

export async function updateImage(input: unknown) {
  return guarded("gallery", imageMetaSchema, input, async (d, user) => {
    if (d.published && d.altText === "Describe this photo") return fail("Write descriptive alt text before publishing.");
    await prisma.galleryImage.update({
      where: { id: d.id },
      data: { title: d.title ?? null, altText: d.altText, caption: d.caption ?? null, category: d.category, spaceId: d.spaceId ?? null, featured: d.featured, published: d.published },
    });
    await audit(user.id, "IMAGE_UPDATED", "GalleryImage", d.id, d.published ? "published" : "unpublished");
    refreshPublic();
    return ok("Image saved.");
  });
}

/** Removes the image and every reference to it so the public site never shows a broken image. */
export async function deleteImage(input: unknown) {
  return guarded("gallery", idSchema, input, async ({ id }, user) => {
    const img = await prisma.galleryImage.findUnique({ where: { id } });
    if (!img) return fail("Image not found.");
    await prisma.$transaction(async (tx) => {
      await tx.propertySpace.updateMany({ where: { coverImageId: id }, data: { coverImageId: null } });
      const rows = await tx.websiteContent.findMany();
      for (const r of rows) {
        const scrub = (v: unknown) =>
          v && typeof v === "object"
            ? Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, x === img.url ? "" : x]))
            : v;
        const draft = scrub(r.draft);
        const published = scrub(r.published);
        if (JSON.stringify(draft) !== JSON.stringify(r.draft) || JSON.stringify(published) !== JSON.stringify(r.published)) {
          await tx.websiteContent.update({ where: { key: r.key }, data: { draft: (draft ?? undefined) as object, published: (published ?? undefined) as object } });
        }
      }
      await tx.galleryImage.delete({ where: { id } });
    });
    await removeStored(img.storageKey);
    await audit(user.id, "IMAGE_DELETED", "GalleryImage", id);
    refreshPublic();
    revalidatePath("/admin/gallery");
    return ok("Image deleted.");
  });
}

// ───────── Generic reorder ─────────

const REORDER_AREA = { image: "gallery", space: "rooms", amenity: "amenities", testimonial: "testimonials", place: "location", faq: "pricing" } as const;
const reorderSchema = z.object({ entity: z.enum(["image", "space", "amenity", "testimonial", "place", "faq"]), ids: z.array(z.string().min(5).max(40)).min(1).max(500) });

export async function reorder(input: unknown) {
  const entity = (input as { entity?: keyof typeof REORDER_AREA })?.entity;
  const area: AdminArea = (entity && REORDER_AREA[entity]) || "gallery";
  return guarded(area, reorderSchema, input, async ({ entity, ids }, user) => {
    const ops = ids.map((id, i) => {
      const data = { sortOrder: i };
      switch (entity) {
        case "image": return prisma.galleryImage.update({ where: { id }, data });
        case "space": return prisma.propertySpace.update({ where: { id }, data });
        case "amenity": return prisma.amenity.update({ where: { id }, data });
        case "testimonial": return prisma.testimonial.update({ where: { id }, data });
        case "place": return prisma.nearbyPlace.update({ where: { id }, data });
        case "faq": return prisma.pricingFAQ.update({ where: { id }, data });
      }
    });
    await prisma.$transaction(ops);
    await audit(user.id, "REORDERED", entity);
    refreshPublic();
    return ok("Order saved.");
  });
}

// ───────── Spaces ─────────

export async function saveSpace(input: unknown) {
  return guarded("rooms", spaceSchema, input, async (d, user) => {
    const clash = await prisma.propertySpace.findFirst({ where: { slug: d.slug, ...(d.id ? { id: { not: d.id } } : {}) } });
    if (clash) return fail("That slug is already used by another space.");
    const data = {
      name: d.name, slug: d.slug, category: d.category, summary: d.summary ?? null, description: d.description ?? null,
      occupancy: d.occupancy ?? null, bedDetails: d.bedDetails ?? null, houseRules: d.houseRules ?? null,
      coverImageId: d.coverImageId ?? null, featured: d.featured, published: d.published,
    };
    const id = await prisma.$transaction(async (tx) => {
      const row = d.id
        ? await tx.propertySpace.update({ where: { id: d.id }, data })
        : await tx.propertySpace.create({ data: { ...data, sortOrder: await tx.propertySpace.count() } });
      await tx.spaceAmenity.deleteMany({ where: { spaceId: row.id } });
      if (d.amenityIds.length) await tx.spaceAmenity.createMany({ data: d.amenityIds.map((amenityId) => ({ spaceId: row.id, amenityId })) });
      return row.id;
    });
    await audit(user.id, d.id ? "SPACE_UPDATED" : "SPACE_CREATED", "PropertySpace", id, d.published ? "published" : "draft");
    refreshPublic();
    revalidatePath("/admin/rooms");
    return ok("Space saved.", { id });
  });
}

const archiveSchema = z.object({ id: z.string().min(5).max(40), archived: z.boolean() });
export async function archiveSpace(input: unknown) {
  return guarded("rooms", archiveSchema, input, async ({ id, archived }, user) => {
    await prisma.propertySpace.update({ where: { id }, data: { archived, ...(archived ? { published: false } : {}) } });
    await audit(user.id, archived ? "SPACE_ARCHIVED" : "SPACE_RESTORED", "PropertySpace", id);
    refreshPublic();
    revalidatePath("/admin/rooms");
    return ok(archived ? "Space archived." : "Space restored.");
  });
}

// ───────── Amenities ─────────

export async function saveAmenity(input: unknown) {
  return guarded("amenities", amenitySchema, input, async (d, user) => {
    const data = { name: d.name, description: d.description ?? null, icon: d.icon, enabled: d.enabled };
    const row = d.id
      ? await prisma.amenity.update({ where: { id: d.id }, data })
      : await prisma.amenity.create({ data: { ...data, sortOrder: await prisma.amenity.count() } });
    await audit(user.id, d.id ? "AMENITY_UPDATED" : "AMENITY_CREATED", "Amenity", row.id, d.enabled ? "enabled" : "disabled");
    refreshPublic();
    revalidatePath("/admin/amenities");
    return ok("Amenity saved.");
  });
}

export async function deleteAmenity(input: unknown) {
  return guarded("amenities", idSchema, input, async ({ id }, user) => {
    await prisma.amenity.delete({ where: { id } });
    await audit(user.id, "AMENITY_DELETED", "Amenity", id);
    refreshPublic();
    revalidatePath("/admin/amenities");
    return ok("Amenity deleted.");
  });
}

// ───────── Testimonials ─────────

export async function saveTestimonial(input: unknown) {
  return guarded("testimonials", testimonialSchema, input, async (d, user) => {
    const data = { guestName: d.guestName, body: d.body, rating: d.rating ?? null, approved: d.approved };
    const row = d.id
      ? await prisma.testimonial.update({ where: { id: d.id }, data })
      : await prisma.testimonial.create({ data: { ...data, sortOrder: await prisma.testimonial.count() } });
    await audit(user.id, d.id ? "TESTIMONIAL_UPDATED" : "TESTIMONIAL_CREATED", "Testimonial", row.id, d.approved ? "approved" : "not approved");
    refreshPublic();
    revalidatePath("/admin/testimonials");
    return ok("Testimonial saved.");
  });
}

export async function deleteTestimonial(input: unknown) {
  return guarded("testimonials", idSchema, input, async ({ id }, user) => {
    await prisma.testimonial.delete({ where: { id } });
    await audit(user.id, "TESTIMONIAL_DELETED", "Testimonial", id);
    refreshPublic();
    revalidatePath("/admin/testimonials");
    return ok("Testimonial removed.");
  });
}

// ───────── Settings & location ─────────

export async function saveSettings(input: unknown) {
  // Both /admin/location and /admin/contact-settings post here; Property Managers may edit them.
  return guarded("contact-settings", settingsSchema, input, async (d, user) => {
    const data = {
      propertyName: d.propertyName, address: d.address ?? null, contactEmail: d.contactEmail ?? null, notifyEmail: d.notifyEmail ?? null,
      phone: d.phone ?? null, whatsappNumber: d.whatsappNumber ?? null, mapsUrl: d.mapsUrl ?? null,
      latitude: d.latitude ?? null, longitude: d.longitude ?? null, instagramUrl: d.instagramUrl ?? null, facebookUrl: d.facebookUrl ?? null,
      checkInTime: d.checkInTime ?? null, checkOutTime: d.checkOutTime ?? null, houseRules: d.houseRules ?? null, maxGuests: d.maxGuests,
    };
    await prisma.propertySettings.upsert({ where: { id: "singleton" }, update: data, create: { id: "singleton", ...data } });
    await audit(user.id, "SETTINGS_UPDATED", "PropertySettings", "singleton");
    refreshPublic();
    revalidatePath("/admin/contact-settings");
    revalidatePath("/admin/location");
    return ok("Settings saved.");
  });
}

export async function saveNearbyPlace(input: unknown) {
  return guarded("location", nearbyPlaceSchema, input, async (d, user) => {
    const data = { name: d.name, description: d.description ?? null, distance: d.distance ?? null };
    const row = d.id
      ? await prisma.nearbyPlace.update({ where: { id: d.id }, data })
      : await prisma.nearbyPlace.create({ data: { ...data, sortOrder: await prisma.nearbyPlace.count() } });
    await audit(user.id, d.id ? "PLACE_UPDATED" : "PLACE_CREATED", "NearbyPlace", row.id);
    refreshPublic();
    revalidatePath("/admin/location");
    return ok("Place saved.");
  });
}

export async function deleteNearbyPlace(input: unknown) {
  return guarded("location", idSchema, input, async ({ id }, user) => {
    await prisma.nearbyPlace.delete({ where: { id } });
    await audit(user.id, "PLACE_DELETED", "NearbyPlace", id);
    refreshPublic();
    revalidatePath("/admin/location");
    return ok("Place removed.");
  });
}
