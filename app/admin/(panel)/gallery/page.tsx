import { PageHeader } from "@/components/admin/shell";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { requirePage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Gallery" };

export default async function AdminGallery() {
  await requirePage("gallery");
  const [images, spaces] = await Promise.all([
    prisma.galleryImage.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.propertySpace.findMany({ where: { archived: false }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <>
      <PageHeader title="Gallery" />
      <GalleryManager spaces={spaces} images={images.map((i) => ({ id: i.id, url: i.url, title: i.title ?? "", altText: i.altText, caption: i.caption ?? "", category: i.category, spaceId: i.spaceId ?? "", featured: i.featured, published: i.published }))} />
    </>
  );
}
