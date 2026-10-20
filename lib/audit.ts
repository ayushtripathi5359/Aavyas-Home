import "server-only";
import { prisma } from "@/lib/db/prisma";

/** Never pass passwords, tokens or guest personal data in `detail`. */
export async function audit(
  actorId: string | null,
  action: string,
  entity?: string,
  entityId?: string,
  detail?: string,
) {
  try {
    await prisma.auditLog.create({ data: { actorId, action, entity, entityId, detail: detail?.slice(0, 500) } });
  } catch (e) {
    console.error("audit log failed", e);
  }
}
