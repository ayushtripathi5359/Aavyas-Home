import { PageHeader } from "@/components/admin/shell";
import { UsersManager } from "@/components/admin/users-manager";
import { requirePage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Users" };

export default async function AdminUsers() {
  const me = await requirePage("users");
  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, role: true, active: true } });
  return (<><PageHeader title="Users" /><UsersManager users={users.map((u) => ({ ...u, self: u.id === me.id }))} /></>);
}
