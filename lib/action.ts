import "server-only";
import { z } from "zod";
import { AuthError, requireUser, type AdminArea, type SessionUser } from "@/lib/auth/guards";

export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; code?: string; fieldErrors?: Record<string, string[]> };

export const ok = <T = undefined>(message?: string, data?: T): ActionResult<T> => ({ ok: true, message, data });
export const fail = (error: string, code?: string): ActionResult<never> => ({ ok: false, error, code });

/**
 * Standard mutation pipeline: authenticate → authorize → validate → execute → structured result.
 * Unknown errors are logged server-side and never leaked to the browser.
 */
export async function guarded<S extends z.ZodType, T = undefined>(
  area: AdminArea,
  schema: S,
  input: unknown,
  run: (data: z.infer<S>, user: SessionUser) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    const user = await requireUser(area);
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      };
    }
    return await run(parsed.data, user);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message);
    console.error(`[action:${area}]`, e);
    return fail("Something went wrong. Please try again.");
  }
}
