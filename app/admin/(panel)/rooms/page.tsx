import { PageHeader } from "@/components/admin/shell";
import { SpacesManager } from "@/components/admin/spaces-manager";
import { requirePage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Rooms & spaces" };

export default async function AdminRooms() {
  await requirePage("rooms");
  const [spaces, images, amenities] = await Promise.all([
    prisma.propertySpace.findMany({ orderBy: { sortOrder: "asc" }, include: { amenities: true } }),
    prisma.galleryImage.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, title: true, altText: true } }),
    prisma.amenity.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <>
      <PageHeader title="Rooms & spaces" />
      <SpacesManager
        amenities={amenities}
        images={images.map((i) => ({ id: i.id, label: i.title || i.altText.slice(0, 50) }))}
        spaces={spaces.map((s) => ({ id: s.id, name: s.name, slug: s.slug, category: s.category, summary: s.summary ?? "", description: s.description ?? "", occupancy: s.occupancy ?? "", bedDetails: s.bedDetails ?? "", houseRules: s.houseRules ?? "", coverImageId: s.coverImageId ?? "", featured: s.featured, published: s.published, archived: s.archived, amenityIds: s.amenities.map((a) => a.amenityId) }))}
      />
    </>
  );
}
