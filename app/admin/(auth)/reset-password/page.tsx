import { ResetForm } from "@/components/admin/reset-forms";

export const metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="card w-full max-w-sm p-7">
        <h1 className="text-4xl">New password</h1>
        <ResetForm mode="reset" token={token ?? ""} />
      </div>
    </main>
  );
}
