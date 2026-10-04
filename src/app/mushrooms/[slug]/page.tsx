import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Detail } from "@/components/detail";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await db.mushroom.findFirst({
    where: { slug, isPublished: true },
    include: {
      images: true,
      regions: true,
      lookalikes: {
        where: { similar: { isPublished: true } },
        include: { similar: true },
      },
    },
  });
  if (!item) notFound();
  return <Detail item={item} />;
}
