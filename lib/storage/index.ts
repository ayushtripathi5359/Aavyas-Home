import "server-only";
import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), ".uploads");
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  "image/jpeg": { ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 },
  "image/png": { ext: "png", magic: (b) => b.subarray(1, 4).toString() === "PNG" },
  "image/webp": { ext: "webp", magic: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
};

export interface StoredFile {
  url: string;
  key: string;
}

export type UploadResult = { ok: true; file: StoredFile } | { ok: false; error: string };

let s3: S3Client | null = null;
function client() {
  s3 ??= new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: !!process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  });
  return s3;
}

const driver = () => (process.env.STORAGE_DRIVER === "s3" ? "s3" : "local");

/** Validates declared type, magic bytes and size, then stores the file. Never throws for user-caused errors. */
export async function storeImage(file: File): Promise<UploadResult> {
  const type = TYPES[file.type];
  if (!type) return { ok: false, error: "Only JPEG, PNG or WebP images are allowed." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "Image must be 10 MB or smaller." };
  const buf = Buffer.from(await file.arrayBuffer());
  if (!type.magic(buf)) return { ok: false, error: "File contents do not match an image." };

  const key = `gallery/${Date.now()}-${randomBytes(6).toString("hex")}.${type.ext}`;
  try {
    if (driver() === "s3") {
      const bucket = process.env.S3_BUCKET;
      const base = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
      if (!bucket || !base) return { ok: false, error: "Image storage is not configured." };
      await client().send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buf, ContentType: file.type, CacheControl: "public, max-age=31536000, immutable" }));
      return { ok: true, file: { key, url: `${base}/${key}` } };
    }
    const dest = path.join(LOCAL_UPLOAD_DIR, key);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, buf);
    return { ok: true, file: { key, url: `/uploads/${key}` } };
  } catch (e) {
    console.error("storage upload failed", e);
    return { ok: false, error: "Image upload failed. Please try again." };
  }
}

/** Best-effort removal; a storage failure must never block the database operation. */
export async function removeStored(key: string | null | undefined) {
  if (!key) return;
  try {
    if (driver() === "s3") {
      await client().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
    } else {
      await fs.rm(path.join(LOCAL_UPLOAD_DIR, key), { force: true });
    }
  } catch (e) {
    console.error("storage delete failed", e);
  }
}
