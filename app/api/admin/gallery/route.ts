import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { audit } from "@/lib/audit";
import { AuthError, requireUser } from "@/lib/auth/guards";
import { removeStored, storeImage } from "@/lib/storage";
import { rateLimit } from "@/lib/security/rate-limit";
import { bustSiteCacheFromRoute } from "@/lib/cache";

const PLACEHOLDER_ALT = "Describe this photo";
const MAX_FILES = 20;

/** Upload new images (field `files`) or replace one (`replaceId` + single `files`). */
export async function POST(req: Request) {
  // CSRF: browsers always send Origin on cross-site POSTs; require same-origin.
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) {
    return NextResponse.json({ ok: false, error: "Bad origin." }, { status: 403 });
  }
  try {
    const user = await requireUser("gallery");
    const rl = await rateLimit(`upload:${user.id}`, 60, 600);
    if (!rl.ok) return NextResponse.json({ ok: false, error: "Too many uploads. Slow down." }, { status: 429 });

    const form = await req.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    const replaceId = form.get("replaceId");
    if (files.length === 0) return NextResponse.json({ ok: false, error: "Choose at least one image." }, { status: 400 });
    if (files.length > MAX_FILES) return NextResponse.json({ ok: false, error: `Upload at most ${MAX_FILES} images at once.` }, { status: 400 });

    const results: { name: string; ok: boolean; error?: string }[] = [];

    if (typeof replaceId === "string" && replaceId) {
      const existing = await prisma.galleryImage.findUnique({ where: { id: replaceId } });
      if (!existing) return NextResponse.json({ ok: false, error: "Image not found." }, { status: 404 });
      const stored = await storeImage(files[0]);
      if (!stored.ok) return NextResponse.json({ ok: false, error: stored.error }, { status: 400 });
      await prisma.galleryImage.update({ where: { id: replaceId }, data: { url: stored.file.url, storageKey: stored.file.key } });
      await removeStored(existing.storageKey);
      await audit(user.id, "IMAGE_REPLACED", "GalleryImage", replaceId);
      results.push({ name: files[0].name, ok: true });
    } else {
      let order = await prisma.galleryImage.count();
      for (const file of files) {
        const stored = await storeImage(file);
        if (!stored.ok) {
          results.push({ name: file.name, ok: false, error: stored.error });
          continue;
        }
        const row = await prisma.galleryImage.create({
          data: { url: stored.file.url, storageKey: stored.file.key, altText: PLACEHOLDER_ALT, category: "OTHER", published: false, sortOrder: order++ },
        });
        await audit(user.id, "IMAGE_UPLOADED", "GalleryImage", row.id);
        results.push({ name: file.name, ok: true });
      }
    }
    revalidatePath("/admin/gallery");
    revalidatePath("/", "layout");
    bustSiteCacheFromRoute();
    return NextResponse.json({ ok: results.some((r) => r.ok), results });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ ok: false, error: e.message }, { status: 401 });
    console.error("upload route failed", e);
    return NextResponse.json({ ok: false, error: "Upload failed." }, { status: 500 });
  }
}
