import { Prisma, Edibility, CollectionStatus } from "@prisma/client";
import { db } from "./db";
export function catalogWhere(
  p: URLSearchParams,
  userId?: string,
): Prisma.MushroomWhereInput {
  const where: Prisma.MushroomWhereInput = { isPublished: true };
  const edible = p
    .getAll("edibility")
    .flatMap((x) => x.split(","))
    .filter((x) => Object.values(Edibility).includes(x as Edibility));
  if (edible.length) where.edibility = { in: edible as Edibility[] };
  const collection = p.get("collection");
  if (
    collection &&
    Object.values(CollectionStatus).includes(collection as CollectionStatus)
  )
    where.collectionStatus = collection as CollectionStatus;
  const q = p.get("q")?.trim();
  if (q)
    where.OR = [
      { nameRu: { contains: q, mode: "insensitive" } },
      { nameLatin: { contains: q, mode: "insensitive" } },
    ];
  const month = Number(p.get("month"));
  if (month >= 1 && month <= 12) where.seasonMonths = { has: month };
  const season = p.get("season");
  const seasons: Record<string, number[]> = {
    spring: [3, 4, 5],
    summer: [6, 7, 8],
    autumn: [9, 10, 11],
    winter: [12, 1, 2],
  };
  if (season && seasons[season])
    where.AND = [{ seasonMonths: { hasSome: seasons[season] } }];
  const difficulty = Number(p.get("difficulty"));
  if (difficulty >= 1 && difficulty <= 3) where.difficulty = difficulty;
  if (p.get("habitat")) where.habitat = { has: p.get("habitat")! };
  if (userId && p.get("progress") === "studied")
    where.progress = { some: { userId, status: "STUDIED" } };
  if (userId && p.get("progress") === "unstarted")
    where.progress = { none: { userId, status: "STUDIED" } };
  return where;
}
export async function getCatalog(p: URLSearchParams, userId?: string) {
  const sort = p.get("sort");
  const orderBy: Prisma.MushroomOrderByWithRelationInput =
    sort === "az"
      ? { nameRu: "asc" }
      : sort === "difficulty"
        ? { difficulty: "asc" }
        : { popularity: "desc" };
  const list = await db.mushroom.findMany({
    where: catalogWhere(p, userId),
    orderBy,
    include: { lookalikes: { select: { similarId: true } } },
  });
  const danger = ["EDIBLE", "CONDITIONAL", "INEDIBLE", "POISONOUS", "DEADLY"];
  if (sort === "danger" || sort === "edible")
    list.sort(
      (a, b) =>
        (danger.indexOf(a.edibility) - danger.indexOf(b.edibility)) *
        (sort === "danger" ? -1 : 1),
    );
  if (sort === "season")
    list.sort(
      (a, b) => Math.min(...a.seasonMonths) - Math.min(...b.seasonMonths),
    );
  if (userId && (sort === "studied" || sort === "unstarted")) {
    const studied = new Set(
      (
        await db.userMushroomProgress.findMany({
          where: { userId, status: "STUDIED" },
        })
      ).map((x) => x.mushroomId),
    );
    list.sort(
      (a, b) =>
        (Number(studied.has(b.id)) - Number(studied.has(a.id))) *
        (sort === "studied" ? 1 : -1),
    );
  }
  return list;
}
