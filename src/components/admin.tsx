"use client";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { edibilityLabels, collectionLabels, months } from "@/lib/constants";
type Editable = {
  id?: string;
  slug: string;
  nameRu: string;
  nameLatin: string;
  description: string;
  edibility: string;
  collectionStatus: string;
  protectionStatus: string;
  toxicityLevel: string;
  difficulty: number;
  capDescription: string;
  stemDescription: string;
  hymenophoreDescription: string;
  fleshDescription: string;
  smellDescription: string;
  sizeDescription: string;
  damageReaction: string;
  habitat: string[];
  associatedTrees: string[];
  seasonMonths: number[];
  warning: string;
  coverImage: string;
  model3dUrl: string | null;
  modelColor: string;
  modelShape: string;
  sourceUrl: string;
  isPublished: boolean;
  popularity: number;
  lookalikes: { similarId: string; differences: string; risk: string }[];
  images: { url: string; alt: string }[];
  regions: { name: string; note: string }[];
};
const blank: Editable = {
  slug: "",
  nameRu: "",
  nameLatin: "",
  description: "",
  edibility: "INEDIBLE",
  collectionStatus: "REGIONAL",
  protectionStatus: "Требуется проверка по региону",
  toxicityLevel: "Требует проверки",
  difficulty: 2,
  capDescription: "Требует проверки",
  stemDescription: "Требует проверки",
  hymenophoreDescription: "Требует проверки",
  fleshDescription: "Требует проверки",
  smellDescription: "Не пробуйте грибы на вкус",
  sizeDescription: "Требует проверки",
  damageReaction: "Требует проверки",
  habitat: ["Смешанный лес"],
  associatedTrees: [],
  seasonMonths: [8, 9, 10],
  warning: "Определение необходимо подтвердить с экспертом.",
  coverImage: "/images/belyy-grib.svg",
  model3dUrl: null,
  modelColor: "#9b6138",
  modelShape: "bolete",
  sourceUrl: "https://www.first-nature.com/fungi/",
  isPublished: false,
  popularity: 0,
  lookalikes: [],
  images: [],
  regions: [],
};
export function Admin() {
  const [items, setItems] = useState<Editable[]>([]),
    [edit, setEdit] = useState<Editable | null>(null),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    const r = await fetch("/api/admin/mushrooms");
    const d = await r.json();
    if (!r.ok) throw Error(d.error);
    setItems(d);
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  function set<K extends keyof Editable>(key: K, value: Editable[K]) {
    setEdit((old) => (old ? { ...old, [key]: value } : null));
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const r = await fetch(
        `/api/admin/mushrooms${edit.id ? "/" + edit.id : ""}`,
        {
          method: edit.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(edit),
        },
      );
      const d = await r.json();
      if (!r.ok)
        throw Error(
          d.details
            ? `${d.error}: ${d.details.map((x: { path: string[]; message: string }) => `${x.path.join(".")}: ${x.message}`).join("; ")}`
            : d.error,
        );
      setEdit(null);
      await load();
      setSuccess("Изменения сохранены");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File, model: boolean) {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      const r = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      if (model) set("model3dUrl", d.url);
      else if (edit) {
        setEdit({
          ...edit,
          coverImage: d.url,
          images: [
            ...edit.images,
            { url: d.url, alt: edit.nameRu || "Фото гриба" },
          ],
        });
      }
      setSuccess("Файл загружен. Сохраните карточку.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const fields: Partial<Record<keyof Editable, string>> = {
    slug: "Slug (латиница)",
    nameRu: "Русское название",
    nameLatin: "Латинское название",
    description: "Описание",
    capDescription: "Шляпка",
    stemDescription: "Ножка",
    hymenophoreDescription: "Нижняя сторона",
    fleshDescription: "Мякоть",
    smellDescription: "Запах",
    sizeDescription: "Размеры",
    damageReaction: "Изменение цвета",
    warning: "Предупреждение",
    protectionStatus: "Охранный статус",
    toxicityLevel: "Токсичность",
    sourceUrl: "Источник (HTTPS)",
    coverImage: "Обложка (URL)",
    model3dUrl: "3D-модель (URL)",
    modelColor: "Цвет учебной модели",
  };
  return (
    <section className="section">
      <div className="eyebrow">CONTENT STUDIO</div>
      <div className="section-heading">
        <h1 className="page-title">Редактор каталога</h1>
        <Button
          onClick={() => {
            setEdit(structuredClone(blank));
            setError("");
            setSuccess("");
          }}
        >
          Добавить гриб +
        </Button>
      </div>
      {error && (
        <p role="alert" className="danger">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="acid">
          {success}
        </p>
      )}
      {edit ? (
        <form onSubmit={save} className="admin-form">
          <div className="section-heading">
            <h2>{edit.id ? "Редактирование" : "Новый вид"}</h2>
            <Button type="button" variant="ghost" onClick={() => setEdit(null)}>
              Закрыть
            </Button>
          </div>
          <div className="form-grid">
            {Object.entries(fields).map(([key, label]) => (
              <label className="field" key={key}>
                {label}
                <textarea
                  aria-label={label}
                  rows={key === "description" ? 4 : 2}
                  required={key !== "model3dUrl"}
                  value={String(edit[key as keyof Editable] ?? "")}
                  onChange={(e) =>
                    set(key as keyof Editable, e.target.value as never)
                  }
                />
              </label>
            ))}
            <label className="field">
              Съедобность
              <select
                value={edit.edibility}
                onChange={(e) => set("edibility", e.target.value)}
              >
                {Object.entries(edibilityLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Сбор
              <select
                value={edit.collectionStatus}
                onChange={(e) => set("collectionStatus", e.target.value)}
              >
                {Object.entries(collectionLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Сложность
              <select
                value={edit.difficulty}
                onChange={(e) => set("difficulty", +e.target.value)}
              >
                {[1, 2, 3].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Форма учебной модели
              <select
                value={edit.modelShape}
                onChange={(e) => set("modelShape", e.target.value)}
              >
                {["bolete", "amanita", "amanita-smooth", "agaric", "chanterelle", "morel", "falsemorel", "bracket", "hoof", "puffball"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Место (через запятую)
              <input
                value={edit.habitat.join(", ")}
                onChange={(e) =>
                  set(
                    "habitat",
                    e.target.value.split(",").map((x) => x.trim()),
                  )
                }
              />
            </label>
            <label className="field">
              Деревья (через запятую)
              <input
                value={edit.associatedTrees.join(", ")}
                onChange={(e) =>
                  set(
                    "associatedTrees",
                    e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  )
                }
              />
            </label>
            <label className="field">
              Фото: JPG, PNG, WebP
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(e) => {
                  if (e.target.files?.[0])
                    void upload(e.target.files[0], false);
                }}
              />
            </label>
            <label className="field">
              Модель: GLB / встроенный GLTF
              <input
                type="file"
                accept=".glb,.gltf"
                disabled={busy}
                onChange={(e) => {
                  if (e.target.files?.[0]) void upload(e.target.files[0], true);
                }}
              />
            </label>
          </div>
          <div className="field">
            Сезон
            <div className="chips">
              {months.map((m, i) => (
                <button
                  type="button"
                  className={
                    edit.seasonMonths.includes(i + 1) ? "chip selected" : "chip"
                  }
                  key={m}
                  onClick={() =>
                    set(
                      "seasonMonths",
                      edit.seasonMonths.includes(i + 1)
                        ? edit.seasonMonths.filter((x) => x !== i + 1)
                        : [...edit.seasonMonths, i + 1].sort((a, b) => a - b),
                    )
                  }
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <label className="check-field">
            <input
              type="checkbox"
              checked={edit.isPublished}
              onChange={(e) => set("isPublished", e.target.checked)}
            />{" "}
            Опубликован в каталоге
          </label>
          <h3>Похожие виды</h3>
          {edit.lookalikes.map((l, i) => (
            <div className="lookalike-editor" key={i}>
              <select
                aria-label="Похожий вид"
                value={l.similarId}
                onChange={(e) =>
                  set(
                    "lookalikes",
                    edit.lookalikes.map((x, n) =>
                      n === i ? { ...x, similarId: e.target.value } : x,
                    ),
                  )
                }
              >
                <option value="">Выберите вид</option>
                {items
                  .filter((x) => x.id !== edit.id)
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.nameRu}
                    </option>
                  ))}
              </select>
              <input
                aria-label="Отличия"
                placeholder="Основные отличия"
                value={l.differences}
                onChange={(e) =>
                  set(
                    "lookalikes",
                    edit.lookalikes.map((x, n) =>
                      n === i ? { ...x, differences: e.target.value } : x,
                    ),
                  )
                }
              />
              <input
                aria-label="Риск"
                value={l.risk}
                onChange={(e) =>
                  set(
                    "lookalikes",
                    edit.lookalikes.map((x, n) =>
                      n === i ? { ...x, risk: e.target.value } : x,
                    ),
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  set(
                    "lookalikes",
                    edit.lookalikes.filter((_, n) => n !== i),
                  )
                }
              >
                Убрать
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              set("lookalikes", [
                ...edit.lookalikes,
                { similarId: "", differences: "", risk: "Высокий" },
              ])
            }
          >
            Добавить двойника +
          </Button>
          <label className="field">
            Регион и ограничение
            <input
              placeholder="Регион"
              value={edit.regions[0]?.name || ""}
              onChange={(e) =>
                set(
                  "regions",
                  e.target.value
                    ? [
                        {
                          name: e.target.value,
                          note: edit.regions[0]?.note || "Требует проверки",
                        },
                      ]
                    : [],
                )
              }
            />
            <textarea
              placeholder="Ограничения и место произрастания"
              value={edit.regions[0]?.note || ""}
              onChange={(e) =>
                set("regions", [
                  {
                    name: edit.regions[0]?.name || "Требует проверки",
                    note: e.target.value,
                  },
                ])
              }
            />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? "Сохранение…" : "Сохранить карточку"} ↗
          </Button>
        </form>
      ) : (
        <div className="admin-list">
          {items.map((item) => (
            <div key={item.id}>
              <div>
                <strong>{item.nameRu}</strong>
                <span className="muted"> {item.nameLatin}</span>
              </div>
              <span className={item.isPublished ? "acid" : "muted"}>
                {item.isPublished ? "Опубликован" : "Скрыт"}
              </span>
              <Button
                variant="outline"
                onClick={() => {
                  setEdit(item);
                  setError("");
                  setSuccess("");
                }}
              >
                Редактировать
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
