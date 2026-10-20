"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { audit } from "@/lib/audit";
import { fail, guarded, ok } from "@/lib/action";
import { GROUP_BY_KEY } from "@/lib/content";

const draftSchema = z.object({ key: z.string().max(60), values: z.record(z.string(), z.string().max(5000)) });
const keySchema = z.object({ key: z.string().max(60) });

const IMAGE_OK = /^(\/[A-Za-z0-9/_\-.]+|https:\/\/[^\s]+)$/;

export async function saveContentDraft(input: unknown) {
  return guarded("website-content", draftSchema, input, async ({ key, values }, user) => {
    const group = GROUP_BY_KEY[key];
    if (!group) return fail("Unknown content block.");
    const clean: Record<string, string> = {};
    for (const f of group.fields) {
      const v = (values[f.name] ?? "").trim();
      if (f.type === "image" && v && !IMAGE_OK.test(v)) return fail(`${f.label}: invalid image reference.`);
      clean[f.name] = v === "" ? f.default : v;
    }
    await prisma.websiteContent.upsert({ where: { key }, update: { draft: clean }, create: { key, draft: clean } });
    await audit(user.id, "CONTENT_DRAFT_SAVED", "WebsiteContent", key);
    revalidatePath("/admin/website-content");
    return ok("Draft saved. Publish to make it live.");
  });
}

export async function publishContent(input: unknown) {
  return guarded("website-content", keySchema, input, async ({ key }, user) => {
    const row = await prisma.websiteContent.findUnique({ where: { key } });
    if (!row?.draft) return fail("There is no draft to publish.");
    await prisma.websiteContent.update({ where: { key }, data: { published: row.draft as object, draft: Prisma.DbNull, publishedAt: new Date() } });
    await audit(user.id, "CONTENT_PUBLISHED", "WebsiteContent", key);
    revalidatePath("/", "layout");
    revalidatePath("/admin/website-content");
    return ok("Published. Changes are live.");
  });
}

export async function discardContentDraft(input: unknown) {
  return guarded("website-content", keySchema, input, async ({ key }, user) => {
    await prisma.websiteContent.updateMany({ where: { key }, data: { draft: Prisma.DbNull } });
    await audit(user.id, "CONTENT_DRAFT_DISCARDED", "WebsiteContent", key);
    revalidatePath("/admin/website-content");
    return ok("Draft discarded.");
  });
}
