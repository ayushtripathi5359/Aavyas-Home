import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { isValidISODate, isoToDbDate } from "@/lib/pricing/dates";

export const PAGE_SIZE = 15;
const STATUSES = ["NEW", "CONTACTED", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;
const SORTS = ["createdAt", "checkIn", "quotedTotal", "guestName"] as const;

export interface EnquiryParams { q?: string; status?: string; from?: string; to?: string; sort?: string; dir?: string; page?: string }

export function parseParams(p: EnquiryParams) {
  const status = STATUSES.find((s) => s === p.status);
  const sort = SORTS.find((s) => s === p.sort) ?? "createdAt";
  const dir: "asc" | "desc" = p.dir === "asc" ? "asc" : "desc";
  const where: Prisma.BookingEnquiryWhereInput = {
    ...(status ? { status } : {}),
    ...(p.q?.trim()
      ? { OR: [
          { reference: { contains: p.q.trim(), mode: "insensitive" } },
          { guestName: { contains: p.q.trim(), mode: "insensitive" } },
          { email: { contains: p.q.trim(), mode: "insensitive" } },
          { phone: { contains: p.q.trim() } },
        ] }
      : {}),
    ...(isValidISODate(p.from) || isValidISODate(p.to)
      ? { checkIn: { ...(isValidISODate(p.from) ? { gte: isoToDbDate(p.from) } : {}), ...(isValidISODate(p.to) ? { lte: isoToDbDate(p.to) } : {}) } }
      : {}),
  };
  return { where, sort, dir, status, page: Math.max(1, Number(p.page) || 1) };
}

export async function listEnquiries(p: EnquiryParams) {
  const { where, sort, dir, page } = parseParams(p);
  const [rows, total] = await Promise.all([
    prisma.bookingEnquiry.findMany({ where, orderBy: { [sort]: dir }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.bookingEnquiry.count({ where }),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function allEnquiries(p: EnquiryParams) {
  const { where, sort, dir } = parseParams(p);
  return prisma.bookingEnquiry.findMany({ where, orderBy: { [sort]: dir }, take: 5000 });
}
