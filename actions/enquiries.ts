"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { audit } from "@/lib/audit";
import { fail, guarded, ok } from "@/lib/action";
import { enquiryStatusEnum } from "@/lib/validation/schemas";

const statusSchema = z.object({ id: z.string().min(5).max(40), status: enquiryStatusEnum });

export async function updateEnquiryStatus(input: unknown) {
  return guarded("enquiries", statusSchema, input, async ({ id, status }, user) => {
    const current = await prisma.bookingEnquiry.findUnique({ where: { id }, select: { status: true, reference: true } });
    if (!current) return fail("Enquiry not found.");
    if (current.status === status) return ok("Status unchanged.");
    await prisma.$transaction([
      prisma.bookingEnquiry.update({ where: { id }, data: { status } }),
      prisma.enquiryStatusHistory.create({ data: { enquiryId: id, fromStatus: current.status, toStatus: status, changedById: user.id } }),
    ]);
    await audit(user.id, "ENQUIRY_STATUS_CHANGED", "BookingEnquiry", id, `${current.reference}: ${current.status} → ${status}`);
    revalidatePath(`/admin/enquiries/${id}`);
    revalidatePath("/admin/enquiries");
    revalidatePath("/admin/dashboard");
    return ok("Status updated.");
  });
}

const noteSchema = z.object({ id: z.string().min(5).max(40), body: z.string().trim().min(1, "Write a note first.").max(2000) });

export async function addEnquiryNote(input: unknown) {
  return guarded("enquiries", noteSchema, input, async ({ id, body }, user) => {
    await prisma.enquiryNote.create({ data: { enquiryId: id, authorId: user.id, body } });
    await audit(user.id, "ENQUIRY_NOTE_ADDED", "BookingEnquiry", id);
    revalidatePath(`/admin/enquiries/${id}`);
    return ok("Note added.");
  });
}
