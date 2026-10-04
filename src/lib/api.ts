import { NextRequest } from "next/server";
import { ZodError } from "zod";
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function assertOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  const configured = process.env.APP_URL;
  const host = req.headers.get("host");
  let sameHost = false;
  try {
    sameHost = !!(
      origin &&
      host &&
      new URL(origin).host === host &&
      ["http:", "https:"].includes(new URL(origin).protocol)
    );
  } catch {
    throw new ApiError("Недопустимый источник запроса", 403);
  }
  if (origin && !sameHost && origin !== configured)
    throw new ApiError("Недопустимый источник запроса", 403);
}
export function endpoint(fn: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    try {
      if (req.method !== "GET") assertOrigin(req);
      return await fn(req);
    } catch (e) {
      if (e instanceof ZodError)
        return Response.json(
          { error: "Проверьте заполненные поля", details: e.issues },
          { status: 400 },
        );
      if (e instanceof ApiError)
        return Response.json({ error: e.message }, { status: e.status });
      console.error(e);
      return Response.json(
        { error: "Не удалось выполнить запрос. Попробуйте позже." },
        { status: 500 },
      );
    }
  };
}
