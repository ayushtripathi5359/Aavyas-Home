import { PageHeader } from "@/components/admin/shell";
import { ContentEditor, type GroupView } from "@/components/admin/content-editor";
import { requirePage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { CONTENT_GROUPS, withDefaults } from "@/lib/content";

export const metadata = { title: "Website content" };

export default async function AdminContent() {
  await requirePage("website-content");
  const [rows, images] = await Promise.all([
    prisma.websiteContent.findMany(),
    prisma.galleryImage.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" }, select: { url: true, title: true, altText: true } }),
  ]);
  const groups: GroupView[] = CONTENT_GROUPS.map((g) => {
    const r = rows.find((x) => x.key === g.key);
    return { key: g.key, label: g.label, description: g.description, hasDraft: !!r?.draft, fields: g.fields.map(({ name, label, type, help }) => ({ name, label, type, help })), values: withDefaults(g.key, r?.draft ?? r?.published) };
  });
  return (
    <>
      <PageHeader title="Website content" />
      <ContentEditor groups={groups} images={images.map((i) => ({ url: i.url, label: i.title || i.altText.slice(0, 50) }))} />
    </>
  );
}
