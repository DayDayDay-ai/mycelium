import { Prisma } from "@prisma/client";
import { loginCredentials, registrationCredentials } from "@/lib/credentials";
import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { ApiError, endpoint } from "@/lib/api";
import { createSession, currentUser, hashToken } from "@/lib/auth";

const attempts = new Map<string, { count: number; until: number }>();
export const POST = endpoint(async (req) => {
  const action = req.nextUrl.pathname.split("/").pop();
  if (action === "logout") {
    const jar = await cookies();
    const token = jar.get("mycelium_session")?.value;
    if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
    jar.delete("mycelium_session");
    return Response.json({ ok: true });
  }
  if (!["login", "register"].includes(action!))
    throw new ApiError("Не найдено", 404);
  const input = await req.json();
  const body = action === "register" ? registrationCredentials.parse(input) : loginCredentials.parse(input);
  const key = body.username;
  const prior = attempts.get(key);
  if (prior && prior.until > Date.now() && prior.count >= 8)
    throw new ApiError("Слишком много попыток. Подождите 15 минут.", 429);
  attempts.set(key, {
    count: prior && prior.until > Date.now() ? prior.count + 1 : 1,
    until: Date.now() + 900000,
  });
  let user = await db.user.findUnique({ where: { username: body.username } });
  if (action === "register") {
    if (user)
      throw new ApiError("Этот ник уже занят. Выберите другой.", 409);
    try {
      user = await db.user.create({
        data: {
          name: registrationCredentials.parse(input).name,
          username: body.username,
          passwordHash: await hash(body.password, 12),
        },
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      throw new ApiError("Этот ник уже занят. Выберите другой.", 409);
    }
  } else if (!user || !(await compare(body.password, user.passwordHash)))
    throw new ApiError("Неверный ник или пароль", 401);
  await createSession(user!.id);
  attempts.delete(key);
  return Response.json({ id: user!.id, name: user!.name, username: user!.username, role: user!.role });
});
export const GET = endpoint(async () => Response.json(await currentUser()));
