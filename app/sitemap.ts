import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
import { siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

const PATHS = ["", "/the-space", "/rooms", "/gallery", "/amenities", "/pricing", "/location", "/contact", "/booking", "/privacy-policy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const spaces = await prisma.propertySpace.findMany({ where: { published: true, archived: false }, select: { slug: true, updatedAt: true } });
  return [
    ...PATHS.map((p) => ({ url: `${siteUrl}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...spaces.map((s) => ({ url: `${siteUrl}/rooms/${s.slug}`, lastModified: s.updatedAt, priority: 0.6 })),
  ];
}
