import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * Deployment diagnostics. Reports only whether things are configured and reachable — never values.
 * Visit /api/health after deploying to see what is missing.
 */
export async function GET() {
  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    AUTH_SECRET: (process.env.AUTH_SECRET?.length ?? 0) >= 16,
    NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
    STORAGE_DRIVER: process.env.STORAGE_DRIVER === "s3" ? "s3" : "local (uploads will not persist on Vercel)",
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
  };

  let database: { reachable: boolean; migrated?: boolean; seeded?: boolean; hasAdmin?: boolean; problem?: string } = { reachable: false };
  if (env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = { reachable: true };
      try {
        const [settings, admins] = await Promise.all([prisma.propertySettings.count(), prisma.adminUser.count()]);
        database = { reachable: true, migrated: true, seeded: settings > 0, hasAdmin: admins > 0 };
      } catch {
        database = { reachable: true, migrated: false, problem: "Tables are missing — run: npm run db:deploy" };
      }
    } catch {
      database = { reachable: false, problem: "Cannot connect — check DATABASE_URL" };
    }
  } else {
    database = { reachable: false, problem: "DATABASE_URL is not set in Vercel → Settings → Environment Variables" };
  }

  const ok = env.DATABASE_URL && env.AUTH_SECRET && database.reachable && database.migrated === true && database.seeded === true;
  return NextResponse.json({ ok, env, database }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
