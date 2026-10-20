import { redirect } from "next/navigation";
import { AdminShell, type AdminLink } from "@/components/admin/shell";
import { canAccess, type AdminArea } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

const LINKS: AdminLink[] = [
  { area: "dashboard", label: "Dashboard" },
  { area: "enquiries", label: "Enquiries" },
  { area: "pricing", label: "Pricing" },
  { area: "gallery", label: "Gallery" },
  { area: "rooms", label: "Rooms & spaces" },
  { area: "amenities", label: "Amenities" },
  { area: "testimonials", label: "Testimonials" },
  { area: "website-content", label: "Website content" },
  { area: "location", label: "Location" },
  { area: "contact-settings", label: "Contact settings" },
  { area: "users", label: "Users" },
  { area: "audit-logs", label: "Audit logs" },
  { area: "settings", label: "Settings" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  const links = LINKS.filter((l) => canAccess(user.role, l.area as AdminArea));
  return <AdminShell links={links} user={{ name: user.name, role: user.role }}>{children}</AdminShell>;
}
