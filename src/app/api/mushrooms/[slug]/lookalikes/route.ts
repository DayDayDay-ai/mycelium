import { db } from "@/lib/db";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const mushroom = await db.mushroom.findFirst({
    where: { slug, isPublished: true },
    include: {
      lookalikes: {
        where: { similar: { isPublished: true } },
        include: { similar: true },
      },
    },
  });
  return mushroom
    ? Response.json(mushroom.lookalikes)
    : Response.json({ error: "Гриб не найден" }, { status: 404 });
}
