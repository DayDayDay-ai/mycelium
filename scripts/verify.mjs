import { chromium } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { testModel } from "./test-model.mjs";
const db = new PrismaClient();
const total = await db.mushroom.count({where:{isPublished:true}});
const edible = await db.mushroom.count({where:{isPublished:true,edibility:'EDIBLE'}});
const base = "http://127.0.0.1:3000";
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: [
    "--enable-webgl",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const results = [];
const errors = [];
let latest;
async function check(name, fn) {
  try {
    await fn();
  } catch (e) {
    if (latest) {
      await latest.screenshot({
        path: "verification/failure.png",
        fullPage: true,
      });
      console.log((await latest.locator("body").innerText()).slice(-7000));
    }
    throw e;
  }
  results.push({ name, status: "PASS" });
  console.log("PASS", name);
}
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
latest = page;
page.on("pageerror", (e) => errors.push(e.message));
await mkdir("verification", { recursive: true });
const username = `verify_${Date.now()}`;
const adminUsername = `admin_${Date.now()}`;
const password = "Verification!2026";
let createdSlug;
try {
  await check("Landing and real WebGL canvas", async () => {
    await page.goto(base);
    await page.getByRole("link", { name: "Начать изучать" }).waitFor();
    await page.locator("canvas").waitFor();
    await page.waitForTimeout(1500);
    assert.equal(await page.locator("canvas").count(), 1);
    await page.screenshot({ path: "verification/desktop-home.png" });
  });
  await check(
    "Start → DB catalogue → combined URL filters → search → sorting",
    async () => {
      await page.getByRole("link", { name: "Начать изучать" }).click();
      await page.locator(".mushroom-card").first().waitFor();
      assert.equal(await page.locator(".mushroom-card").count(), total);
      await page
        .getByRole("button", { name: "Съедобный", exact: true })
        .click();
      await page.waitForURL(/edibility=EDIBLE/);
      await page.waitForTimeout(600);
      assert.equal(await page.locator(".mushroom-card").count(), edible);
      await page.getByRole("button", { name: /Фильтры/ }).click();
      await page.getByLabel("Месяц", { exact: true }).selectOption("8");
      await page.getByRole("button", { name: /Показать виды/ }).click();
      await page.getByLabel("Поиск грибов").fill("Белый");
      await page.getByRole("button", { name: "Искать", exact: true }).click();
      await page.waitForTimeout(600);
      assert.equal(await page.locator(".mushroom-card").count(), 1);
      assert.ok(page.url().includes("month=8"));
      await page.getByLabel("Сортировка").selectOption("az");
      await page.waitForTimeout(300);
      await page.screenshot({ path: "verification/desktop-catalog.png" });
    },
  );
  await check(
    "Detail → rotate 3D → compare → READY → studied → guest persistence",
    async () => {
      await page.locator(".mushroom-card").click();
      await page.waitForFunction(()=>{const img=document.querySelector('.specimen-photo img');return img && img.complete && img.naturalWidth>0;});
      assert.ok(await page.getByText('Где искать',{exact:false}).count());
      assert.equal(await page.getByText('Проверить регион',{exact:true}).count(),0);
      await page.screenshot({path:'verification/desktop-photo.png'});
      await page.getByRole('button',{name:'3D-модель',exact:true}).click();
      await page.locator("canvas").waitFor();
      await page.waitForTimeout(1000);
      const canvas = page.locator("canvas");
      const box = await canvas.boundingBox();
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.6, {
        steps: 15,
      });
      await page.mouse.up();
      assert.equal(
        await page.getByText("DRAG TO ROTATE", { exact: false }).count(),
        0,
      );
      await page.getByRole("button", { name: "Сравнить", exact: true }).click();
      await page.getByRole("dialog").waitFor();
      assert.ok(
        await page
          .getByRole("dialog")
          .getByText("Жёлчный гриб", { exact: true })
          .count(),
      );
      await page.getByRole("button", { name: "Закрыть", exact: true }).click();
      await page.locator(".ready-section").scrollIntoViewIfNeeded();
      await page.getByRole("dialog").waitFor();
      await page
        .getByRole("button", { name: "Да, изучил", exact: true })
        .click();
      await page.waitForURL(base + "/mushrooms"); await page.getByText("Изучено", { exact: true }).first().waitFor(); await page.goto(base + "/mushrooms/belyy-grib"); await page.reload();
      await page.locator(".studied-inline").waitFor();
      await page.screenshot({ path: "verification/desktop-detail.png" });
      await page.goto(base + "/progress");
      await page.getByText(`1 / ${total} изучено`, { exact: false }).waitFor();
    },
  );
  await check(
    "Register → explicit local import → DB sync → logout → login",
    async () => {
      const registrationData = { name: "Проверка", username, usernameConfirm: username, password, passwordConfirm: password };
      for (const change of [{ usernameConfirm: "different_user" }, { passwordConfirm: "different" }, { username: "грибник", usernameConfirm: "грибник" }]) {
        const bad = await page.request.post(base + "/api/auth/register", { data: { ...registrationData, ...change } });
        assert.equal(bad.status(), 400);
      }
      await page.goto(base + "/account");
      await page
        .getByRole("button", { name: "Нет аккаунта? Зарегистрироваться" })
        .click();
      await page.getByLabel("Имя", { exact: true }).fill("Проверка");
      await page.getByLabel("Ник", { exact: true }).fill(username);
      await page.getByLabel("Повтори ник", { exact: true }).fill(username);
      await page.getByLabel("Повтори пароль", { exact: true }).fill(password);
      await page.screenshot({ path: "verification/registration.png", fullPage: true });
      await page.getByLabel("Пароль", { exact: true }).fill(password);
      await page
        .getByRole("button", { name: "Создать аккаунт", exact: false })
        .click();
      await page
        .getByRole("button", { name: "Перенести локальный прогресс" })
        .waitFor();
      await page
        .getByRole("button", { name: "Перенести локальный прогресс" })
        .click();
      await page.getByText("Готово", { exact: true }).waitFor();
      const duplicate = await page.request.post(base + "/api/auth/register", { data: { ...registrationData, username: username.toUpperCase(), usernameConfirm: username.toUpperCase() } });
      assert.equal(duplicate.status(), 409);
      const user = await db.user.findUniqueOrThrow({ where: { username } });
      assert.equal(
        await db.userMushroomProgress.count({
          where: { userId: user.id, status: "STUDIED" },
        }),
        1,
      );
      await page.getByRole("button", { name: "Выйти", exact: true }).click();
      await page.getByLabel("Ник", { exact: true }).waitFor();
      await page.getByLabel("Ник", { exact: true }).fill(username.toUpperCase());
      await page.getByLabel("Пароль", { exact: true }).fill(password);
      await page.getByRole("button", { name: /^Войти/ }).click();
      await page.getByText("@" + username, { exact: true }).waitFor();
      await page.goto(base + "/progress");
      await page.getByText(`1 / ${total} изучено`, { exact: false }).waitFor();
    },
  );
  await check("API authorization, input validation and CSRF", async () => {
    const anon = await browser.newContext();
    const req = anon.request;
    assert.equal(
      (
        await req.post(base + "/api/progress/nope/studied", { data: {} })
      ).status(),
      401,
    );
    assert.equal((await req.get(base + "/api/admin/mushrooms")).status(), 401);
    assert.equal(
      (await context.request.get(base + "/api/admin/mushrooms")).status(),
      403,
    );
    assert.equal(
      (
        await req.post(base + "/api/auth/register", {
          data: { username: "invalid", password: "abc" },
        })
      ).status(),
      400,
    );
    assert.equal(
      (
        await req.post(base + "/api/auth/logout", {
          headers: { origin: "https://evil.test" },
          data: {},
        })
      ).status(),
      403,
    );
    await anon.close();
  });
  await check(
    "Admin create → edit → photo + GLB upload → render → hide; DB verified",
    async () => {
      await db.user.create({
        data: {
          username: adminUsername,
          name: "Проверка администратора",
          passwordHash: await hash(password, 12),
          role: "ADMIN",
        },
      });
      const admin = await browser.newContext();
      const r = await admin.request.post(base + "/api/auth/login", {
        data: { username: adminUsername, password },
      });
      assert.equal(r.status(), 200);
      const ap = await admin.newPage();
      latest = ap;
      await ap.goto(base + "/admin");
      await ap.getByRole("button", { name: "Добавить гриб +" }).click();
      createdSlug = `verification-${Date.now()}`;
      await ap.getByLabel("Slug (латиница)", { exact: true }).fill(createdSlug);
      await ap
        .getByLabel("Русское название", { exact: true })
        .fill("Проверочный вид");
      await ap
        .getByLabel("Латинское название", { exact: true })
        .fill("Testus verification");
      await ap
        .getByLabel("Описание", { exact: true })
        .fill("Временная запись для проверки редактора");
      await ap.getByLabel("Опубликован в каталоге").check();
      await ap
        .getByRole("button", { name: "Сохранить карточку", exact: false })
        .click();
      await ap.getByText("Изменения сохранены").waitFor();
      assert.equal(
        (
          await admin.request.get(base + "/api/mushrooms/" + createdSlug)
        ).status(),
        200,
      );
      await ap
        .locator(".admin-list>div")
        .filter({ hasText: "Проверочный вид" })
        .getByRole("button", { name: "Редактировать" })
        .click();
      await ap
        .getByLabel("Русское название", { exact: true })
        .fill("Изменённый вид");
      const png = await page.screenshot();
      await ap
        .getByLabel("Фото: JPG, PNG, WebP", { exact: true })
        .setInputFiles({
          name: "verify.png",
          mimeType: "image/png",
          buffer: png,
        });
      await ap.getByText("Файл загружен. Сохраните карточку.").waitFor();
      const upload = await admin.request.post(base + "/api/admin/upload", {
        multipart: {
          file: {
            name: "fixture.glb",
            mimeType: "model/gltf-binary",
            buffer: testModel(),
          },
        },
      });
      assert.equal(upload.status(), 200);
      const { url: modelUrl } = await upload.json();
      await ap.getByLabel("3D-модель (URL)", { exact: true }).fill(modelUrl);
      await ap
        .getByRole("button", { name: "Сохранить карточку", exact: false })
        .click();
      await ap.getByText("Изменения сохранены").waitFor();
      const modelPage = await admin.newPage();
      modelPage.on("pageerror", (e) => errors.push(e.message));
      await modelPage.goto(base + "/mushrooms/" + createdSlug);
      await modelPage.getByRole('button',{name:'3D-модель',exact:true}).click();
      await modelPage.locator("canvas").waitFor();
      await modelPage.getByText("3D MODEL", { exact: true }).waitFor();
      await modelPage.waitForTimeout(1000);
      assert.equal(await modelPage.locator(".viewer-fallback").count(), 0);
      await modelPage.locator('.gallery').scrollIntoViewIfNeeded();
      await modelPage.waitForFunction(()=>{const img=document.querySelector('.gallery img');return img && img.complete && img.naturalWidth>0;});
      await modelPage.screenshot({ path: "verification/imported-glb.png" });
      await modelPage.close();
      await ap
        .locator(".admin-list>div")
        .filter({ hasText: "Изменённый вид" })
        .getByRole("button", { name: "Редактировать" })
        .click();
      await ap.getByLabel("Опубликован в каталоге").uncheck();
      await ap
        .getByRole("button", { name: "Сохранить карточку", exact: false })
        .click();
      await ap.getByText("Изменения сохранены").waitFor();
      const row = await db.mushroom.findUniqueOrThrow({
        where: { slug: createdSlug },
        include: { images: true },
      });
      assert.equal(row.nameRu, "Изменённый вид");
      assert.equal(row.images.length, 1);
      assert.equal(
        (
          await admin.request.get(base + "/api/mushrooms/" + createdSlug)
        ).status(),
        404,
      );
      await ap.screenshot({ path: "verification/desktop-admin.png" });
      await admin.close();
    },
  );
  await check(
    "Mobile: landing, filters, 3D, progress; no horizontal overflow",
    async () => {
      const mobile = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      const mp = await mobile.newPage();
      latest = mp;
      mp.on("pageerror", (e) => errors.push(e.message));
      for (const [route, file] of [
        ["/", "mobile-home"],
        ["/mushrooms", "mobile-catalog"],
        ["/mushrooms/muhomor", "mobile-detail"],
        ["/progress", "mobile-progress"],
      ]) {
        await mp.goto(base + route);
        if (route === "/mushrooms")
          await mp.locator(".mushroom-card").first().waitFor();
        if (route.includes('/mushrooms/muhomor')) {
          await mp.waitForFunction(()=>{const img=document.querySelector('.specimen-photo img');return img && img.complete && img.naturalWidth>0;});
          await mp.screenshot({path:'verification/mobile-photo.png'});
          await mp.getByRole('button',{name:'3D-модель',exact:true}).click();
        }
        if (route === "/" || route.includes("/mushrooms/muhomor"))
          await mp.locator("canvas").waitFor();
        await mp.waitForTimeout(500);
        assert.ok(
          await mp.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `overflow on ${route}`,
        );
        await mp.screenshot({
          path: `verification/${file}.png`,
          fullPage: route === "/progress",
        });
      }
      await mp.goto(base + "/mushrooms");
      await mp.getByRole("button", { name: /Фильтры/ }).click();
      await mp.getByLabel("Сложность", { exact: true }).selectOption("3");
      await mp.getByRole("button", { name: /Показать виды/ }).click();
      await mp.waitForTimeout(700);
      assert.equal(await mp.locator(".mushroom-card").count(), 1);
      await mobile.close();
    },
  );
  assert.deepEqual(errors, [], "Browser page errors");
  await writeFile(
    "verification/report.json",
    JSON.stringify(
      { checkedAt: new Date().toISOString(), results, browserErrors: errors },
      null,
      2,
    ),
  );
} finally {
  if (createdSlug)
    await db.mushroom.deleteMany({ where: { slug: createdSlug } });
  await db.user.deleteMany({ where: { username: { in: [username, adminUsername] } } });
  await browser.close();
  await db.$disconnect();
}




