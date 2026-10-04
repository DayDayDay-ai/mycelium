"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Mushroom } from "@prisma/client";
import {
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  Check,
  Rotate3D,
} from "lucide-react";
import { edibilityLabels, collectionLabels, months } from "@/lib/constants";
import { useLearning } from "./provider";
import { Button } from "./ui/button";
import { Modal } from "./ui/dialog";
export function MushroomCard({ item }: { item: Mushroom }) {
  const { progress } = useLearning();
  const studied = progress[item.id]?.status === "STUDIED";
  const danger = ["POISONOUS", "DEADLY"].includes(item.edibility);
  return (
    <Link className="mushroom-card" href={`/mushrooms/${item.slug}`}>
      <div className="card-image">
        <Image
          src={item.coverImage}
          alt={item.nameRu}
          fill
          sizes="(max-width:600px) 100vw,(max-width:1000px) 50vw,33vw"
        />
        <span className="card-number">
          SPECIMEN / {item.nameLatin.split(" ")[0].toUpperCase()}
        </span>
        <span className="card-3d">
          <Rotate3D size={16} /> 3D
        </span>
        {studied && (
          <span className="studied">
            <Check size={14} /> Изучено
          </span>
        )}
        <span className="card-arrow">
          <ArrowUpRight />
        </span>
      </div>
      <div className="card-body">
        <span className={danger ? "danger status" : "status"}>
          ● {edibilityLabels[item.edibility]}
        </span>
        <h3>{item.nameRu}</h3>
        <p className="latin">{item.nameLatin}</p>
        <div className="card-meta">
          <span>{item.habitat.slice(0, 2).join(" · ")}</span>
          <span>
            {item.seasonMonths.map((x) => months[x - 1]).slice(0, 1)} —{" "}
            {months[item.seasonMonths.at(-1)! - 1]}
          </span>
        </div>
        <div className="card-difficulty">
          Определение{" "}
          <span>
            {["", "Легко", "Средне", "Сложно"][item.difficulty]}{" "}
            {"●".repeat(item.difficulty)}
          </span>
        </div>
      </div>
    </Link>
  );
}
export function Catalog() {
  const params = useSearchParams(),
    router = useRouter();
  const { user, progress, ready } = useLearning();
  const [items, setItems] = useState<Mushroom[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [open, setOpen] = useState(false);
  const [query, setQuery] = useState(params.get("q") || "");
  const serialized = params.toString();
  useEffect(() => {
    setQuery(params.get("q") || "");
  }, [serialized, params]);
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`/api/mushrooms?${serialized}`, { signal: ctrl.signal })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw Error(data.error);
        setItems(data);
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [serialized, user]);
  const update = (key: string, value: string) => {
    const p = new URLSearchParams(serialized);
    if (value) p.set(key, value);
    else p.delete(key);
    router.replace(`/mushrooms?${p}`, { scroll: false });
  };
  const toggleEdibility = (value: string) => {
    const p = new URLSearchParams(serialized);
    let selected = (p.get("edibility") || "").split(",").filter(Boolean);
    selected = selected.includes(value)
      ? selected.filter((x) => x !== value)
      : [...selected, value];
    if (selected.length) p.set("edibility", selected.join(","));
    else p.delete("edibility");
    router.replace(`/mushrooms?${p}`, { scroll: false });
  };
  const visible = useMemo(() => {
    let data = [...items];
    const status = params.get("progress");
    if (!user && status)
      data = data.filter(
        (x) =>
          (progress[x.id]?.status === "STUDIED") === (status === "studied"),
      );
    const sort = params.get("sort");
    if (sort === "studied" || sort === "unstarted")
      data.sort(
        (a, b) =>
          (Number(progress[b.id]?.status === "STUDIED") -
            Number(progress[a.id]?.status === "STUDIED")) *
          (sort === "studied" ? 1 : -1),
      );
    return data;
  }, [items, params, progress, user]);
  const count = [
    "edibility",
    "collection",
    "month",
    "difficulty",
    "progress",
    "habitat",
    "season",
  ].filter((k) => params.has(k)).length;
  const select = (
    key: string,
    label: string,
    options: Record<string, string>,
  ) => (
    <label className="field" key={key}>
      {label}
      <select
        aria-label={label}
        value={params.get(key) || ""}
        onChange={(e) => update(key, e.target.value)}
      >
        <option value="">Все</option>
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <section className="catalog-section">
      <div className="catalog-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> ТВОЯ ТЕРРИТОРИЯ ЗНАНИЙ
          </div>
          <h1>
            ГРИБЫ<span className="acid">.</span>
          </h1>
        </div>
        <p className="muted">
          Смотри глубже.
          <br />
          Каждый вид — новое открытие.
        </p>
      </div>
      <div className="filter-bar">
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            update("q", query);
          }}
        >
          <Search size={18} />
          <input
            aria-label="Поиск грибов"
            placeholder="Название или латинское имя"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button aria-label="Искать" type="submit">
            <ArrowUpRight size={18} />
          </button>
        </form>
        <Button variant="outline" onClick={() => setOpen(true)}>
          <SlidersHorizontal size={17} /> Фильтры{" "}
          {count > 0 ? `· ${count}` : "+"}
        </Button>
        <select
          aria-label="Сортировка"
          className="sort-select"
          value={params.get("sort") || "popular"}
          onChange={(e) => update("sort", e.target.value)}
        >
          {Object.entries({
            popular: "По популярности",
            edible: "Сначала съедобные",
            danger: "Сначала опасные",
            unstarted: "Сначала неизученные",
            studied: "Сначала изученные",
            difficulty: "По сложности",
            season: "По сезону",
            az: "А–Я",
          }).map(([k, v]) => (
            <option value={k} key={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="chips">
        <button
          className={!count ? "chip selected" : "chip"}
          onClick={() => router.replace("/mushrooms", { scroll: false })}
        >
          Все виды
        </button>
        {Object.entries(edibilityLabels).map(([k, v]) => (
          <button
            key={k}
            className={
              (params.get("edibility") || "").split(",").includes(k)
                ? "chip selected"
                : "chip"
            }
            onClick={() => toggleEdibility(k)}
          >
            {v}
          </button>
        ))}
        <button
          className={
            params.get("collection") === "ALLOWED" ? "chip selected" : "chip"
          }
          onClick={() =>
            update(
              "collection",
              params.get("collection") === "ALLOWED" ? "" : "ALLOWED",
            )
          }
        >
          Можно собирать
        </button>
        <button
          className={
            params.get("collection") === "FORBIDDEN" ? "chip selected" : "chip"
          }
          onClick={() =>
            update(
              "collection",
              params.get("collection") === "FORBIDDEN" ? "" : "FORBIDDEN",
            )
          }
        >
          Нельзя собирать
        </button>
        {[
          ["studied", "Изученные"],
          ["unstarted", "Неизученные"],
        ].map(([k, v]) => (
          <button
            key={k}
            className={params.get("progress") === k ? "chip selected" : "chip"}
            onClick={() =>
              update("progress", params.get("progress") === k ? "" : k)
            }
          >
            {v}
          </button>
        ))}
      </div>
      <div className="results-heading">
        <span>
          {loading ? "Загрузка…" : `${visible.length} видов для изучения`}
        </span>
        <span>СОБИРАЙ ЗНАНИЯ, А НЕ СЛУЧАЙНОСТИ</span>
      </div>
      {error ? (
        <div className="empty-state">
          <p role="alert">{error}</p>
          <Button onClick={() => location.reload()}>Повторить</Button>
        </div>
      ) : loading || !ready ? (
        <div className="card-grid">
          {[1, 2, 3].map((x) => (
            <div key={x} className="card-skeleton pulse" />
          ))}
        </div>
      ) : visible.length ? (
        <div className="card-grid">
          {visible.map((item) => (
            <MushroomCard item={item} key={item.id} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Здесь пока тихо.</h2>
          <p className="muted">Попробуйте другую комбинацию фильтров.</p>
          <Button onClick={() => router.replace("/mushrooms")}>
            Сбросить фильтры
          </Button>
        </div>
      )}
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Твой маршрут"
        description="Между группами действует AND. Несколько категорий съедобности объединяются через OR."
      >
        <div className="form-grid">
          {select("collection", "Сбор", collectionLabels)}
          {select("season", "Сезон", {
            spring: "Весна",
            summer: "Лето",
            autumn: "Осень",
            winter: "Зима",
          })}
          {select(
            "month",
            "Месяц",
            Object.fromEntries(months.map((m, i) => [i + 1, m])),
          )}
          {select("difficulty", "Сложность", {
            "1": "Легко",
            "2": "Средне",
            "3": "Сложно",
          })}
          {select("progress", "Обучение", {
            studied: "Изучено",
            unstarted: "Не изучено",
          })}
          {select("habitat", "Место", {
            "Хвойный лес": "Хвойный лес",
            "Лиственный лес": "Лиственный лес",
            "Смешанный лес": "Смешанный лес",
            Луг: "Луг",
            Поляна: "Поляна",
            Древесина: "Древесина",
          })}
        </div>
        <div className="modal-actions">
          <Button
            variant="outline"
            onClick={() => router.replace("/mushrooms")}
          >
            Сбросить
          </Button>
          <Button onClick={() => setOpen(false)}>
            Показать виды <ArrowUpRight size={18} />
          </Button>
        </div>
      </Modal>
    </section>
  );
}
