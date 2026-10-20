import "server-only";
import { redirect } from "next/navigation";
import type { AdminRole } from "@prisma/client";
import { getCurrentUser } from "./session";

export type AdminArea =
  | "dashboard" | "enquiries" | "pricing" | "gallery" | "rooms" | "amenities" | "testimonials"
  | "website-content" | "location" | "contact-settings" | "audit-logs" | "users" | "settings";

/** Property Managers run day-to-day operations; security-critical areas are Super Admin only. */
const SUPER_ONLY: AdminArea[] = ["users", "settings", "audit-logs"];

export const canAccess = (role: AdminRole, area: AdminArea) =>
  role === "SUPER_ADMIN" || !SUPER_ONLY.includes(area);

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** For pages/layouts: redirects to login when unauthenticated, to the dashboard when forbidden. */
export async function requirePage(area: AdminArea): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (!canAccess(user.role, area)) redirect("/admin/dashboard");
  return user;
}

export class AuthError extends Error {}

/** For actions and route handlers: throws instead of redirecting. */
export async function requireUser(area: AdminArea): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("You must be signed in.");
  if (!canAccess(user.role, area)) throw new AuthError("You do not have permission to do that.");
  return user;
}
