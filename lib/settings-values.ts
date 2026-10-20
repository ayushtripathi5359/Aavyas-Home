import "server-only";
import type { SettingsValues } from "@/components/admin/settings-form";
import { prisma } from "@/lib/db/prisma";

export async function loadSettingsValues(): Promise<SettingsValues> {
  const s = await prisma.propertySettings.findUnique({ where: { id: "singleton" } });
  return {
    propertyName: s?.propertyName ?? "Aavya's Home", address: s?.address ?? "", contactEmail: s?.contactEmail ?? "", notifyEmail: s?.notifyEmail ?? "",
    phone: s?.phone ?? "", whatsappNumber: s?.whatsappNumber ?? "", mapsUrl: s?.mapsUrl ?? "",
    latitude: s?.latitude?.toString() ?? "", longitude: s?.longitude?.toString() ?? "",
    instagramUrl: s?.instagramUrl ?? "", facebookUrl: s?.facebookUrl ?? "", checkInTime: s?.checkInTime ?? "", checkOutTime: s?.checkOutTime ?? "",
    houseRules: s?.houseRules ?? "", maxGuests: String(s?.maxGuests ?? 6),
  };
}
