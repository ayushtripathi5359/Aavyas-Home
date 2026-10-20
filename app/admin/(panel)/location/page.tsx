import { PageHeader } from "@/components/admin/shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { PlacesManager } from "@/components/admin/places-manager";
import { requirePage } from "@/lib/auth/guards";
import { loadSettingsValues } from "@/lib/settings-values";
import { getNearbyPlaces } from "@/lib/site";

export const metadata = { title: "Location" };

export default async function AdminLocation() {
  await requirePage("location");
  const [values, places] = await Promise.all([loadSettingsValues(), getNearbyPlaces()]);
  return (
    <>
      <PageHeader title="Location" />
      <div className="space-y-6">
        <SettingsForm section="location" initial={values} />
        <PlacesManager rows={places.map((p) => ({ id: p.id, name: p.name, description: p.description ?? "", distance: p.distance ?? "" }))} />
      </div>
    </>
  );
}
