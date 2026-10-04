"use client";
import { useEffect, useState } from "react";
import type { Mushroom } from "@prisma/client";
import Link from "next/link";
import { ArrowUpRight, Trophy } from "lucide-react";
import { useLearning } from "./provider";
import { levels } from "@/lib/constants";
import { MushroomCard } from "./catalog";
import { Button } from "./ui/button";
export function ProgressPage() {
  const { progress, user, ready, guestCount, importGuest } = useLearning();
  const [items, setItems] = useState<
      (Mushroom & { lookalikes: { similarId: string }[] })[]
    >([]),
    [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/mushrooms")
      .then(async (r) => {
        if (!r.ok) throw Error("Не удалось загрузить каталог");
        setItems(await r.json());
      })
      .catch((e) => setError(e.message));
  }, []);
  const studied = items.filter((x) => progress[x.id]?.status === "STUDIED");
  const count = studied.length;
  const level = levels.filter((x) => x.at <= count).at(-1)!;
  const next = levels.find((x) => x.at > count);
  const remaining = items.filter((x) => progress[x.id]?.status !== "STUDIED");
  const recommendedIds = new Set(
    studied.flatMap((x) => x.lookalikes.map((y) => y.similarId)),
  );
  const recommended = [...remaining]
    .sort(
      (a, b) =>
        Number(recommendedIds.has(b.id)) - Number(recommendedIds.has(a.id)),
    )
    .slice(0, 3);
  const recent = [...studied]
    .sort((a, b) =>
      (progress[b.id].studiedAt || "").localeCompare(
        progress[a.id].studiedAt || "",
      ),
    )
    .slice(0, 3);
  return (
    <section className="section">
      <div className="eyebrow">ТВОЙ ПУТЬ В MYCELIUM</div>
      <h1 className="page-title">
        МОЙ ПРОГРЕСС<span className="acid">.</span>
      </h1>
      {error && (
        <p className="danger" role="alert">
          {error}
        </p>
      )}
      <div className="progress-panel">
        <div className="level-symbol">
          <Trophy size={44} />
        </div>
        <div className="progress-main">
          <div className="eyebrow">ТЕКУЩИЙ УРОВЕНЬ</div>
          <h2>{level.name}</h2>
          <div className="progress-track">
            <div
              style={{
                width: `${items.length ? (count / items.length) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="muted">
            {ready ? count : "…"} / {items.length} изучено ·{" "}
            {items.length ? Math.round((count / items.length) * 100) : 0}%
            каталога
          </p>
          {next && (
            <p className="muted">
              Ещё {next.at - count} видов до уровня «{next.name}»
            </p>
          )}
        </div>
        <div className="progress-number">
          {String(count).padStart(2, "0")}
          <span>ВИДОВ ИЗУЧЕНО</span>
        </div>
      </div>
      {!user && (
        <div className="inline-banner">
          <p>
            Прогресс сохранён в этом браузере. Создай аккаунт, чтобы продолжить
            на другом устройстве.
          </p>
          <Button asChild variant="outline">
            <Link href="/account">
              Сохранить в аккаунте <ArrowUpRight size={18} />
            </Link>
          </Button>
        </div>
      )}
      {user && guestCount > 0 && (
        <div className="inline-banner">
          <p>
            В браузере есть {guestCount} изученных видов. Перенести в аккаунт?
          </p>
          <Button
            onClick={() => importGuest().catch((e) => setError(e.message))}
          >
            Перенести прогресс
          </Button>
        </div>
      )}
      <div className="category-stats">
        {[
          ["Съедобные", ["EDIBLE", "CONDITIONAL"]],
          ["Ядовитые", ["POISONOUS", "DEADLY"]],
          ["С похожими видами", []],
        ].map(([label, types]) => (
          <div key={label as string}>
            <span>{label}</span>
            <strong>
              {
                studied.filter((x) =>
                  (types as string[]).length
                    ? (types as string[]).includes(x.edibility)
                    : x.lookalikes.length > 0,
                ).length
              }
            </strong>
          </div>
        ))}
      </div>
      <div className="section-heading">
        <h2>Что дальше?</h2>
        <Link href="/mushrooms">Весь каталог ↗</Link>
      </div>
      {recommended.some((x) => recommendedIds.has(x.id)) && (
        <p className="muted">
          Ты уже изучил один из похожих видов. Теперь сравни его с двойником.
        </p>
      )}
      <div className="card-grid">
        {recommended.map((x) => (
          <MushroomCard item={x} key={x.id} />
        ))}
      </div>
      {!remaining.length && items.length > 0 && (
        <p className="acid">
          Весь текущий каталог изучен. Повтори материал перед новым маршрутом.
        </p>
      )}
      {recent.length > 0 && (
        <>
          <div className="section-heading">
            <h2>Последние изученные</h2>
          </div>
          <div className="card-grid">
            {recent.map((x) => (
              <MushroomCard item={x} key={x.id} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
