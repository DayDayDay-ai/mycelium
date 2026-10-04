import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError, endpoint } from "@/lib/api";
import { z } from "zod";
export const GET = endpoint(async () => {
  const user = await currentUser();
  if (!user) throw new ApiError("Войдите в аккаунт", 401);
  return Response.json(
    await db.userMushroomProgress.findMany({
      where: { userId: user.id, mushroom: { isPublished: true } },
    }),
  );
});
export const POST = endpoint(async (req) => {
  const user = await currentUser();
  if (!user) throw new ApiError("Войдите в аккаунт", 401);
  const { ids } = z
    .object({ ids: z.array(z.string()).max(2000) })
    .parse(await req.json());
  const existing = await db.mushroom.findMany({
    where: { id: { in: ids }, isPublished: true },
    select: { id: true },
  });
  await db.$transaction(
    existing.map(({ id: mushroomId }) =>
      db.userMushroomProgress.upsert({
        where: { userId_mushroomId: { userId: user.id, mushroomId } },
        create: {
          userId: user.id,
          mushroomId,
          status: "STUDIED",
          studiedAt: new Date(),
        },
        update: { status: "STUDIED", studiedAt: new Date() },
      }),
    ),
  );
  return Response.json({ ok: true });
});
