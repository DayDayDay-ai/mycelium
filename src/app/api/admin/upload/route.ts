import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/admin";
import { ApiError, endpoint } from "@/lib/api";
export const POST = endpoint(async (req) => {
  await requireAdmin();
  const data = await req.formData();
  const file = data.get("file");
  if (!(file instanceof File)) throw new ApiError("Выберите файл");
  if (file.size > 20 * 1024 * 1024) throw new ApiError("Максимум 20 МБ");
  const ext = path.extname(file.name).toLowerCase();
  if (![".jpg", ".jpeg", ".png", ".webp", ".glb", ".gltf"].includes(ext))
    throw new ApiError("Поддерживаются JPG, PNG, WebP, GLB, GLTF");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (
    [".jpg", ".jpeg"].includes(ext) &&
    bytes.subarray(0, 3).toString("hex") !== "ffd8ff"
  )
    throw new ApiError("Некорректный JPEG");
  if (
    ext === ".png" &&
    bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a"
  )
    throw new ApiError("Некорректный PNG");
  if (
    ext === ".webp" &&
    (bytes.subarray(0, 4).toString() !== "RIFF" ||
      bytes.subarray(8, 12).toString() !== "WEBP")
  )
    throw new ApiError("Некорректный WebP");
  if (ext === ".glb" && bytes.subarray(0, 4).toString() !== "glTF")
    throw new ApiError("Некорректный GLB");
  if (ext === ".gltf") {
    try {
      const model = JSON.parse(bytes.toString());
      if (model.asset?.version !== "2.0") throw Error();
    } catch {
      throw new ApiError("Некорректный GLTF 2.0");
    }
  }
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const name = randomUUID() + ext;
  await writeFile(path.join(dir, name), bytes);
  return Response.json({ url: `/uploads/${name}` });
});
