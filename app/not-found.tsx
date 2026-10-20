import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-page flex min-h-[60vh] flex-col items-start justify-center gap-4 py-20">
      <p className="eyebrow">404</p>
      <h1 className="text-5xl">We couldn’t find that page.</h1>
      <Link href="/" className="btn btn-primary">Back to home</Link>
    </main>
  );
}
