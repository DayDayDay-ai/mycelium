import { z } from "zod";

const username = z.string().trim().regex(/^[A-Za-z][A-Za-z0-9_]{2,29}$/, "Ник: 3–30 символов латиницей, цифры и _; первый символ — буква").transform(value => value.toLowerCase());
const password = z.string().min(4, "Пароль должен содержать минимум 4 символа").max(72, "Пароль слишком длинный").refine(value => new TextEncoder().encode(value).length <= 72, "Пароль должен занимать не более 72 байт UTF-8");
export const loginCredentials = z.object({ username, password });
export const registrationCredentials = loginCredentials.extend({
  name: z.string().trim().min(1, "Введите имя").max(80, "Имя слишком длинное"),
  usernameConfirm: username,
  passwordConfirm: z.string(),
}).refine(value => value.username === value.usernameConfirm, { message: "Ники не совпадают", path: ["usernameConfirm"] }).refine(value => value.password === value.passwordConfirm, { message: "Пароли не совпадают", path: ["passwordConfirm"] });

