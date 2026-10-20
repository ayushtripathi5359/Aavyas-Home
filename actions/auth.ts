"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { audit } from "@/lib/audit";
import { fail, guarded, ok } from "@/lib/action";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyCurrentSession, getCurrentUser, hashToken, revokeUserSessions } from "@/lib/auth/session";
import { clearRateLimit, clientIp, rateLimit } from "@/lib/security/rate-limit";
import { loginSchema, userCreateSchema } from "@/lib/validation/schemas";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/env";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function login(input: unknown) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fail("Enter a valid email and password.");
  const { email, password } = parsed.data;

  const ip = await clientIp();
  const [byIp, byEmail] = await Promise.all([rateLimit(`login:ip:${ip}`, 20, 900), rateLimit(`login:email:${email}`, 5, 900)]);
  if (!byIp.ok || !byEmail.ok) return fail("Too many attempts. Please try again in a few minutes.");

  const user = await prisma.adminUser.findUnique({ where: { email } });
  const valid = await verifyPassword(password, user?.passwordHash);
  if (!user || !valid || !user.active) {
    await audit(user?.id ?? null, "LOGIN_FAILED", "AdminUser", user?.id);
    return fail("Incorrect email or password.");
  }
  await clearRateLimit(`login:email:${email}`);
  await createSession(user.id, (await headers()).get("user-agent"));
  await audit(user.id, "LOGIN", "AdminUser", user.id);
  return ok();
}

export async function logout() {
  const user = await getCurrentUser();
  await destroyCurrentSession();
  if (user) await audit(user.id, "LOGOUT", "AdminUser", user.id);
  return ok();
}

export async function requestPasswordReset(input: unknown) {
  const parsed = z.object({ email: z.string().trim().toLowerCase().email() }).safeParse(input);
  const generic = ok("If that account exists, a reset link has been sent.");
  if (!parsed.success) return generic;
  if (!process.env.RESEND_API_KEY) return fail("Password reset by email is not configured. Ask a Super Admin to reset your password.");
  const rl = await rateLimit(`reset:${await clientIp()}`, 5, 3600);
  if (!rl.ok) return fail("Too many requests. Try again later.");
  const user = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (user?.active) {
    const token = randomBytes(32).toString("base64url");
    await prisma.passwordResetToken.create({ data: { tokenHash: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + 3_600_000) } });
    await sendEmail({ to: user.email, subject: "Reset your admin password", text: `Reset your password (valid for 1 hour):\n${siteUrl}/admin/reset-password?token=${token}\n\nIf you did not request this, ignore this email.` });
  }
  return generic;
}

export async function resetPassword(input: unknown) {
  const parsed = z.object({ token: z.string().min(20).max(200), password: z.string().max(128) }).safeParse(input);
  if (!parsed.success) return fail("Invalid request.");
  const problem = passwordProblem(parsed.data.password);
  if (problem) return fail(problem);
  const rec = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(parsed.data.token) } });
  if (!rec || rec.usedAt || rec.expiresAt < new Date()) return fail("This reset link is invalid or has expired.");
  await prisma.$transaction([
    prisma.adminUser.update({ where: { id: rec.userId }, data: { passwordHash: await hashPassword(parsed.data.password) } }),
    prisma.passwordResetToken.update({ where: { id: rec.id }, data: { usedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: rec.userId } }),
  ]);
  await audit(rec.userId, "PASSWORD_RESET", "AdminUser", rec.userId);
  return ok("Password updated. You can sign in now.");
}

export async function createAdminUser(input: unknown) {
  return guarded("users", userCreateSchema, input, async (d, user) => {
    const problem = passwordProblem(d.password);
    if (problem) return fail(problem);
    if (await prisma.adminUser.findUnique({ where: { email: d.email } })) return fail("A user with that email already exists.");
    const created = await prisma.adminUser.create({ data: { name: d.name, email: d.email, role: d.role, passwordHash: await hashPassword(d.password) } });
    await audit(user.id, "USER_CREATED", "AdminUser", created.id, `role ${d.role}`);
    revalidatePath("/admin/users");
    return ok("User created.");
  });
}

const userUpdateSchema = z.object({
  id: z.string().min(5).max(40),
  active: z.boolean().optional(),
  role: z.enum(["SUPER_ADMIN", "PROPERTY_MANAGER"]).optional(),
  newPassword: z.string().max(128).optional(),
});

export async function updateAdminUser(input: unknown) {
  return guarded("users", userUpdateSchema, input, async (d, user) => {
    const target = await prisma.adminUser.findUnique({ where: { id: d.id } });
    if (!target) return fail("User not found.");
    const demoting = (d.active === false || (d.role && d.role !== "SUPER_ADMIN")) && target.role === "SUPER_ADMIN";
    if (demoting) {
      const supers = await prisma.adminUser.count({ where: { role: "SUPER_ADMIN", active: true } });
      if (supers <= 1) return fail("There must always be at least one active Super Admin.");
    }
    const data: Record<string, unknown> = {};
    if (d.active !== undefined) data.active = d.active;
    if (d.role) data.role = d.role;
    if (d.newPassword) {
      const problem = passwordProblem(d.newPassword);
      if (problem) return fail(problem);
      data.passwordHash = await hashPassword(d.newPassword);
    }
    await prisma.adminUser.update({ where: { id: d.id }, data });
    if (d.active === false || d.newPassword || d.role) await revokeUserSessions(d.id);
    await audit(user.id, "USER_UPDATED", "AdminUser", d.id, Object.keys(data).filter((k) => k !== "passwordHash").join(","));
    revalidatePath("/admin/users");
    return ok("User updated.");
  });
}
