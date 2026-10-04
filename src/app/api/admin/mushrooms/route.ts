import { db } from "@/lib/db";
import { endpoint, ApiError } from "@/lib/api";
import { requireAdmin, mushroomSchema } from "@/lib/admin";
export const GET = endpoint(async () => {
  await requireAdmin();
  return Response.json(
    await db.mushroom.findMany({
      orderBy: { nameRu: "asc" },
      include: { images: true, regions: true, lookalikes: true },
    }),
  );
});
export const POST = endpoint(async (req) => {
  await requireAdmin();
  const { lookalikes, images, regions, ...data } = mushroomSchema.parse(
    await req.json(),
  );
  if (await db.mushroom.findUnique({ where: { slug: data.slug } }))
    throw new ApiError("Этот slug уже существует", 409);
  return Response.json(
    await db.mushroom.create({
      data: {
        ...data,
        lookalikes: { create: lookalikes },
        images: { create: images },
        regions: { create: regions },
      },
    }),
  );
});
