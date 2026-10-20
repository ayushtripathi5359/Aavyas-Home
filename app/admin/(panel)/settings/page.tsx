import { PageHeader } from "@/components/admin/shell";
import { requirePage } from "@/lib/auth/guards";

export const metadata = { title: "Settings" };

/** Integration status. Secrets are never displayed — only whether they are configured. */
export default async function AdminSettings() {
  await requirePage("settings");
  const driver = process.env.STORAGE_DRIVER === "s3" ? "s3" : "local";
  const s3Ready = !!(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && process.env.S3_PUBLIC_BASE_URL);
  const rows = [
    { name: "Image storage", status: driver === "s3" ? (s3Ready ? "S3-compatible storage configured" : "S3 selected but credentials are incomplete") : "Local disk (development only — use S3 in production)", ok: driver === "s3" && s3Ready },
    { name: "Email (Resend)", status: process.env.RESEND_API_KEY ? "API key configured" : "Not configured — enquiry emails and password reset are disabled", ok: !!process.env.RESEND_API_KEY },
    { name: "Public site URL", status: process.env.NEXT_PUBLIC_SITE_URL ?? "Not set (defaults to http://localhost:3000)", ok: !!process.env.NEXT_PUBLIC_SITE_URL },
  ];
  return (
    <>
      <PageHeader title="Settings" />
      <section className="card p-5">
        <h2 className="text-2xl">Integrations</h2>
        <p className="mt-1 text-sm text-espresso/70">Configured through environment variables on the server — see the README. Values are never shown here.</p>
        <ul className="mt-4 divide-y divide-beige">
          {rows.map((r) => (
            <li key={r.name} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span className="font-medium">{r.name}</span><span className={r.ok ? "text-olive-dark" : "text-amber-800"}>{r.status}</span></li>
          ))}
        </ul>
      </section>
    </>
  );
}
