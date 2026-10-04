import { cookies } from "next/headers";
import { randomBytes, createHash } from "node:crypto";
import { db } from "./db";
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function currentUser() {
  const token = (await cookies()).get("mycelium_session")?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: { select: { id: true, name: true, username: true, role: true } } },
  });
  return session && session.expiresAt > new Date() ? session.user : null;
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 30 * 86400000);
  await db.session.create({
    data: { id: hashToken(token), userId, expiresAt: expires },
  });
  (await cookies()).set("mycelium_session", token, {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" &&
      process.env.APP_URL?.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    expires,
  });
}
