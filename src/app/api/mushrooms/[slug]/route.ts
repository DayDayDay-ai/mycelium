import { db } from "@/lib/db";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const item = await db.mushroom.findFirst({
    where: { slug, isPublished: true },
    include: {
      images: true,
      regions: true,
      lookalikes: { include: { similar: true } },
    },
  });
  return item
    ? Response.json(item)
    : Response.json({ error: "Гриб не найден" }, { status: 404 });
}
