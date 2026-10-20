import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Creates the first Super Admin. Credentials come from env (INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD),
 * never from source code. Refuses to run if a Super Admin already exists.
 */
async function main() {
  const prisma = new PrismaClient();
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD first.");
  if (password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error("Password must be 10+ characters with letters and numbers.");
  }
  if (await prisma.adminUser.count({ where: { role: "SUPER_ADMIN" } })) {
    throw new Error("A Super Admin already exists. Use the Users page to add more admins.");
  }
  const user = await prisma.adminUser.create({
    data: { email, name: "Super Admin", role: "SUPER_ADMIN", passwordHash: await bcrypt.hash(password, 12) },
  });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "SUPER_ADMIN_BOOTSTRAPPED", entity: "AdminUser", entityId: user.id } });
  console.log(`Super Admin created: ${email}. Remove INITIAL_ADMIN_PASSWORD from your environment now.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
