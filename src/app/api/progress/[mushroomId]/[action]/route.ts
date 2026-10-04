import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { ApiError, endpoint } from "@/lib/api";
export const POST = endpoint(async (req) => {
  const parts = req.nextUrl.pathname.split("/");
  const action = parts.pop();
  const mushroomId = parts.pop()!;
  const user = await currentUser();
  if (!user) throw new ApiError("Войдите в аккаунт", 401);
  if (!["start", "studied", "reset"].includes(action!))
    throw new ApiError("Не найдено", 404);
  if (
    !(await db.mushroom.findFirst({
      where: { id: mushroomId, isPublished: true },
    }))
  )
    throw new ApiError("Гриб не найден", 404);
  const key = { userId_mushroomId: { userId: user.id, mushroomId } };
  if (action === "reset") {
    await db.userMushroomProgress.deleteMany({
      where: { userId: user.id, mushroomId },
    });
    return Response.json({ ok: true });
  }
  const old = await db.userMushroomProgress.findUnique({ where: key });
  if (action === "start" && old?.status === "STUDIED")
    return Response.json(old);
  const data = {
    status:
      action === "studied" ? ("STUDIED" as const) : ("IN_PROGRESS" as const),
    studiedAt: action === "studied" ? new Date() : null,
  };
  return Response.json(
    await db.userMushroomProgress.upsert({
      where: key,
      create: { userId: user.id, mushroomId, ...data },
      update: data,
    }),
  );
});
