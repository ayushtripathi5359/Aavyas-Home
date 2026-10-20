import { PageHeader } from "@/components/admin/shell";
import { AmenitiesManager } from "@/components/admin/amenities-manager";
import { requirePage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Amenities" };

export default async function AdminAmenities() {
  await requirePage("amenities");
  const rows = await prisma.amenity.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageHeader title="Amenities" />
      <AmenitiesManager rows={rows.map((a) => ({ id: a.id, name: a.name, description: a.description ?? "", icon: a.icon, enabled: a.enabled }))} />
    </>
  );
}
