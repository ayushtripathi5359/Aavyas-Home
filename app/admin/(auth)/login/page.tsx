import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin/dashboard");
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="card w-full max-w-sm p-7">
        <p className="eyebrow">Aavya’s Home</p>
        <h1 className="mt-2 text-4xl">Admin sign in</h1>
        <LoginForm />
      </div>
    </main>
  );
}
