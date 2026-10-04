import { z } from "zod";
import { currentUser } from "./auth";
import { ApiError } from "./api";
export async function requireAdmin() {
  const user = await currentUser();
  if (!user) throw new ApiError("Войдите в аккаунт", 401);
  if (user.role !== "ADMIN")
    throw new ApiError("Доступ только для администратора", 403);
  return user;
}
const text = z.string().trim().min(1).max(10000);
const url = z
  .string()
  .max(2048)
  .refine(
    (x) =>
      x.startsWith("/images/") ||
      x.startsWith("/photos/") ||
      x.startsWith("/uploads/") ||
      /^https:\/\/(images\.unsplash\.com|upload\.wikimedia\.org)\//.test(x),
    "Используйте загрузку файла или разрешённый HTTPS источник",
  );
export const mushroomSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100),
  nameRu: text,
  nameLatin: text,
  description: text,
  edibility: z.enum([
    "EDIBLE",
    "CONDITIONAL",
    "INEDIBLE",
    "POISONOUS",
    "DEADLY",
  ]),
  collectionStatus: z.enum(["ALLOWED", "FORBIDDEN", "REGIONAL"]),
  protectionStatus: text,
  toxicityLevel: text,
  difficulty: z.number().int().min(1).max(3),
  capDescription: text,
  stemDescription: text,
  hymenophoreDescription: text,
  fleshDescription: text,
  smellDescription: text,
  sizeDescription: text,
  damageReaction: text,
  habitat: z.array(text).min(1).max(20),
  associatedTrees: z.array(text).max(20),
  seasonMonths: z.array(z.number().int().min(1).max(12)).min(1).max(12),
  warning: text,
  coverImage: url,
  model3dUrl: z
    .string()
    .max(2048)
    .refine((x) => !x || x.startsWith("/uploads/") || /^https:\/\//.test(x))
    .nullable(),
  modelColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  modelShape: z.enum(["bolete", "amanita", "amanita-smooth", "agaric", "chanterelle", "morel", "falsemorel", "bracket", "hoof", "puffball"]),
  sourceUrl: z.url().refine((x) => x.startsWith("https://")),
  isPublished: z.boolean(),
  popularity: z.number().int().min(0).max(10000),
  lookalikes: z
    .array(z.object({ similarId: text, differences: text, risk: text }))
    .max(100),
  images: z.array(z.object({ url, alt: text })).max(30),
  regions: z.array(z.object({ name: text, note: text })).max(100),
});
