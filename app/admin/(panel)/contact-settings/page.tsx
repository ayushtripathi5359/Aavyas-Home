import { PageHeader } from "@/components/admin/shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { requirePage } from "@/lib/auth/guards";
import { loadSettingsValues } from "@/lib/settings-values";

export const metadata = { title: "Contact settings" };

export default async function ContactSettings() {
  await requirePage("contact-settings");
  return (<><PageHeader title="Contact settings" /><SettingsForm section="contact" initial={await loadSettingsValues()} /></>);
}
