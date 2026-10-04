import { db } from "@/lib/db";
import { endpoint, ApiError } from "@/lib/api";
import { requireAdmin, mushroomSchema } from "@/lib/admin";
export const PUT = endpoint(async (req) => {
  await requireAdmin();
  const id = req.nextUrl.pathname.split("/").pop()!;
  const { lookalikes, images, regions, ...data } = mushroomSchema.parse(
    await req.json(),
  );
  if (lookalikes.some((x) => x.similarId === id))
    throw new ApiError("Вид не может быть собственным двойником");
  if (!(await db.mushroom.findUnique({ where: { id } })))
    throw new ApiError("Гриб не найден", 404);
  const duplicate = await db.mushroom.findFirst({
    where: { slug: data.slug, id: { not: id } },
  });
  if (duplicate) throw new ApiError("Этот slug уже существует", 409);
  return Response.json(
    await db.mushroom.update({
      where: { id },
      data: {
        ...data,
        lookalikes: { deleteMany: {}, create: lookalikes },
        images: { deleteMany: {}, create: images },
        regions: { deleteMany: {}, create: regions },
      },
    }),
  );
});
