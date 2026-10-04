import { endpoint } from "@/lib/api";
import { getCatalog } from "@/lib/catalog";
import { currentUser } from "@/lib/auth";
export const GET = endpoint(async (req) =>
  Response.json(
    await getCatalog(req.nextUrl.searchParams, (await currentUser())?.id),
  ),
);
