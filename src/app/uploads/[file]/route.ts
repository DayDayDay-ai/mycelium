import { readFile } from "node:fs/promises";
import path from "node:path";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  if (!/^[0-9a-f-]{36}\.(jpg|jpeg|png|webp|glb|gltf)$/.test(file))
    return new Response("Not found", { status: 404 });
  const mime: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
  };
  try {
    const bytes = await readFile(
      path.join(process.cwd(), "public", "uploads", file),
    );
    return new Response(bytes, {
      headers: {
        "Content-Type": mime[path.extname(file)],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
