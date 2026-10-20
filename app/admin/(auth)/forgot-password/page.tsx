import { ResetForm } from "@/components/admin/reset-forms";

export const metadata = { title: "Reset password", robots: { index: false } };

export default function ForgotPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="card w-full max-w-sm p-7">
        <h1 className="text-4xl">Forgot password</h1>
        <ResetForm mode="request" />
      </div>
    </main>
  );
}
