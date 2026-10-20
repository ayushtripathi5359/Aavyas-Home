import { PageHeader } from "@/components/admin/shell";
import { TestimonialsManager } from "@/components/admin/testimonials-manager";
import { requirePage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Testimonials" };

export default async function AdminTestimonials() {
  await requirePage("testimonials");
  const rows = await prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageHeader title="Testimonials" />
      <TestimonialsManager rows={rows.map((t) => ({ id: t.id, guestName: t.guestName, body: t.body, rating: t.rating ? String(t.rating) : "", approved: t.approved }))} />
    </>
  );
}
