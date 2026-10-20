import bcrypt from "bcryptjs";

const COST = 12;
// Pre-computed hash used to equalise timing when the account does not exist.
const DUMMY = bcrypt.hashSync("not-a-real-password", COST);

export const hashPassword = (plain: string) => bcrypt.hash(plain, COST);

export async function verifyPassword(plain: string, hash: string | null | undefined): Promise<boolean> {
  const ok = await bcrypt.compare(plain, hash ?? DUMMY);
  return ok && !!hash;
}

/** At least 10 chars, with letters and digits. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 10) return "Password must be at least 10 characters.";
  if (pw.length > 128) return "Password is too long.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Password must contain letters and numbers.";
  return null;
}
