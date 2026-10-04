"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { asset } from "@/lib/assets";
import type {
  Mushroom,
  MushroomLookalike,
  MushroomImage,
  MushroomRegion,
} from "@/lib/mushroom-types";
import { ArrowLeft, ArrowUpRight, Check, ShieldAlert } from "lucide-react";
import {
  edibilityLabels,
  collectionLabels,
  months,
  warning,
} from "@/lib/constants";
import { useLearning } from "./provider";
import { Button } from "./ui/button";
import { Modal } from "./ui/dialog";
import photoCredits from "@/lib/photo-credits.json";
const Viewer = dynamic(() => import("./viewer"), {
  ssr: false,
  loading: () => <div className="viewer pulse">Загрузка 3D…</div>,
});
type DetailItem = Mushroom & {
  images: MushroomImage[];
  regions: MushroomRegion[];
  lookalikes: (MushroomLookalike & { similar: Mushroom })[];
};
function SpecimenMedia({ item }: { item: DetailItem }) {
  const [mode, setMode] = useState<"photo" | "model">("photo");
  const [failed, setFailed] = useState(false);
  const photo = item.images.find(x => x.url === item.coverImage) || item.images[0];
  const credit = (photoCredits as Record<string, {url:string;author:string;license:string;licenseUrl:string;sourceUrl:string;observationUrl:string}>)[item.slug];
  return <div className="specimen-media">
    <div className="media-tabs" role="group" aria-label="Режим просмотра гриба">
      <button type="button" aria-pressed={mode === "photo"} onClick={() => setMode("photo")}>Фото</button>
      <button type="button" aria-pressed={mode === "model"} onClick={() => setMode("model")}>3D-модель</button>
    </div>
    {mode === "model" ? <Viewer color={item.modelColor} shape={item.modelShape} species={item.slug} url={item.model3dUrl ? asset(item.model3dUrl) : null}/> :
      <div className="specimen-photo">
        {photo && !failed ? <Image src={asset(photo.url)} alt={photo.alt} fill unoptimized={photo.url.startsWith("https://")} sizes="(max-width:900px) 100vw,55vw" onError={() => setFailed(true)}/> : <div className="photo-empty"><span>{failed ? "Не удалось загрузить фотографию" : "Фотография ещё не добавлена"}</span><p>Откройте 3D-модель для изучения общей формы.</p><Button variant="outline" onClick={() => setMode("model")}>Открыть 3D</Button></div>}
      </div>}
    <p className="media-caption">{mode === "model" ? "Учебная 3D-модель общей формы. Не определитель вида." : photo?.alt || "Фотография появится после проверки источника."}</p>
    {mode === "photo" && credit?.url === photo?.url && <p className="media-caption"><a href={credit.sourceUrl} target="_blank" rel="noreferrer">Автор и оригинал ↗</a> · <a href={credit.licenseUrl} target="_blank" rel="noreferrer">{credit.license === "public-domain" ? "Общественное достояние" : credit.license.toUpperCase()}</a></p>}
  </div>;
}
export function Detail({ item }: { item: DetailItem }) {
  const router = useRouter();
  const { progress, mark, ready, error } = useLearning();
  const studied = progress[item.id]?.status === "STUDIED";
  const [open, setOpen] = useState(false),
    [compare, setCompare] = useState<Mushroom | null>(null),
    [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null),
    asked = useRef(false),
    started = useRef(false);
  useEffect(() => {
    if (ready && !started.current) {
      started.current = true;
      void mark(item.id, "start").catch(() => {});
    }
  }, [ready, mark, item.id]);
  useEffect(() => {
    if (!ready || studied || asked.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !asked.current) {
          asked.current = true;
          setOpen(true);
        }
      },
      { threshold: 0.4 },
    );
    if (end.current) observer.observe(end.current);
    return () => observer.disconnect();
  }, [ready, studied]);
  const study = async () => {
    setBusy(true);
    try {
      await mark(item.id, "studied");
      setOpen(false);
      router.push("/mushrooms");
    } catch {
    } finally {
      setBusy(false);
    }
  };
  const facts = [
    ["Съедобность", edibilityLabels[item.edibility]],
    ["Где искать", item.habitat.join(" · ")],
    ["Сезон", item.seasonMonths.map((x) => months[x - 1]).join(" · ")],
    ["Сложность", ["", "Легко", "Средне", "Сложно"][item.difficulty]],
  ];
  return (
    <article className="detail">
      <Link href="/mushrooms" className="back">
        <ArrowLeft size={16} /> Каталог / {item.nameRu}
      </Link>
      <div className="detail-hero">
        <SpecimenMedia item={item}/>
        <div className="detail-title">
          <div className="eyebrow">ЗНАКОМЬСЯ БЛИЖЕ</div>
          <h1>{item.nameRu}</h1>
          <p className="latin">{item.nameLatin}</p>
          <div className="facts">
            {facts.map(([label, value], i) => (
              <div key={label}>
                <span>
                  0{i + 1} / {label}
                </span>
                <strong
                  className={
                    i === 0 && ["POISONOUS", "DEADLY"].includes(item.edibility)
                      ? "danger"
                      : ""
                  }
                >
                  {value}
                </strong>
              </div>
            ))}
          </div>
          {studied && (
            <div className="studied-inline">
              <Check /> Изучено
            </div>
          )}
        </div>
      </div>
      <div className="safety detail-warning">
        <ShieldAlert size={22} />
        <div>
          <strong>{item.warning}</strong>
          <p>{warning}</p>
        </div>
      </div>
      <div className="detail-content">
        <section>
          <div className="eyebrow">01 / РАССМОТРИ ПРИЗНАКИ</div>
          <h2>Как выглядит</h2>
          <p className="description">{item.description}</p>
          <div className="traits">
            {[
              ["Шляпка", item.capDescription],
              ["Ножка", item.stemDescription],
              ["Нижняя сторона", item.hymenophoreDescription],
              ["Мякоть", item.fleshDescription],
              ["Запах", item.smellDescription],
              ["Размеры", item.sizeDescription],
              ["При повреждении", item.damageReaction],
            ].filter(([, v]) => v && !v.startsWith("Требует провер")).map(([k, v]) => (
              <div key={k}>
                <span>{k}</span>
                <p>{v}</p>
              </div>
            ))}
          </div>
          <p className="model-disclaimer">
            Процедурная модель показывает общую форму и не воспроизводит все
            диагностические признаки. Сведения в карточке — статичный справочник,
            а не прогноз мест произрастания.
          </p>
          {item.images.length > 0 && (
            <div className="gallery">
              {item.images.map((x) => (
                <Image
                  key={x.id}
                  src={asset(x.url)}
                  alt={x.alt}
                  width={600}
                  height={400}
                />
              ))}
            </div>
          )}
        </section>
        <section>
          <div className="eyebrow">02 / МЕСТО ВСТРЕЧИ</div>
          <h2>Где растёт</h2>
          <div className="habitat-tags">
            {item.habitat.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
          {item.associatedTrees.filter(x => !x.startsWith("Требует провер")).length > 0 && <p className="muted">
            Связанные деревья: {item.associatedTrees.join(", ")}.
          </p>}
          {item.regions.length > 0 && <p className="muted">{item.regions.map(x => `${x.name}: ${x.note}`).join("; ")}</p>}
        </section>
        <section>
          <div className="eyebrow">03 / КАЛЕНДАРЬ</div>
          <h2>Когда искать</h2>
          <div className="month-scale">
            {months.map((m, i) => (
              <div
                key={m}
                className={item.seasonMonths.includes(i + 1) ? "in-season" : ""}
              >
                <span>{m}</span>
                <div />
              </div>
            ))}
          </div>
          <p className="muted">
            Календарь по справочнику First Nature для Британии и Ирландии.
            В других регионах сроки отличаются; это не прогноз наличия грибов.
          </p>
        </section>
        <section>
          <div className="eyebrow">04 / НЕ ПЕРЕПУТАЙ</div>
          <h2>Похожие виды</h2>
          {item.lookalikes.length ? (
            item.lookalikes.map((x) => (
              <div className="lookalike" key={x.id}>
                <Image
                  src={asset(x.similar.coverImage)}
                  alt={x.similar.nameRu}
                  width={180}
                  height={160}
                />
                <div>
                  <Link href={`/mushrooms/${x.similar.slug}`}>
                    <h3>{x.similar.nameRu} ↗</h3>
                  </Link>
                  <span
                    className={
                      ["DEADLY", "POISONOUS"].includes(x.similar.edibility)
                        ? "danger"
                        : "acid"
                    }
                  >
                    {edibilityLabels[x.similar.edibility]}
                  </span>
                  <p>{x.differences}</p>
                  <p className="muted">Риск: {x.risk}</p>
                </div>
                <Button variant="outline" onClick={() => setCompare(x.similar)}>
                  Сравнить
                </Button>
              </div>
            ))
          ) : (
            <p className="muted">
              Список двойников требует проверки редактором. Отсутствие списка не
              означает отсутствие похожих видов.
            </p>
          )}
        </section>
        <section>
          <div className="eyebrow">05 / ОТВЕТСТВЕННЫЙ ПОДХОД</div>
          <h2>Что важно знать</h2>
          <p>{item.warning}</p>
        </section>
        <section ref={end} className="ready-section">
          <div className="eyebrow">06 / ЗАКРЕПИ ЗНАНИЯ</div>
          <h2>{studied ? "В твоей коллекции знаний." : "Всё понял?"}</h2>
          <p className="muted">
            Сможешь назвать основные признаки и опасных двойников?
          </p>
          <Button
            disabled={busy || !ready}
            onClick={() =>
              studied
                ? document
                    .querySelector(".detail-hero")
                    ?.scrollIntoView({ behavior: "smooth" })
                : setOpen(true)
            }
          >
            {studied ? "Повторить материал" : "Да, готов проверить себя"}{" "}
            <ArrowUpRight />
          </Button>
          {studied && (
            <Button
              variant="ghost"
              onClick={() => mark(item.id, "reset").catch(() => {})}
            >
              Сбросить отметку
            </Button>
          )}
          {error && (
            <p role="alert" className="danger">
              {error}
            </p>
          )}
        </section>
      </div>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="READY?"
        description={`Ты запомнил основные признаки: ${item.nameRu}?`}
      >
        <p className="muted">
          Отметка фиксирует просмотр материала, а не подтверждает умение
          определять грибы в природе.
        </p>
        <div className="modal-actions">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Ещё посмотреть
          </Button>
          <Button onClick={study} disabled={busy}>
            {busy ? "Сохраняем…" : "Да, изучил"} <Check size={18} />
          </Button>
        </div>
        {error && (
          <p className="danger" role="alert">
            {error}
          </p>
        )}
      </Modal>
      <Modal
        open={!!compare}
        onOpenChange={() => setCompare(null)}
        title="Сравни признаки"
        description="Проверяй совокупность признаков, а не один признак."
      >
        {compare && (
          <div className="comparison">
            {[item, compare].map((x) => (
              <div key={x.id}>
                <Image
                  src={asset(x.coverImage)}
                  alt={x.nameRu}
                  width={300}
                  height={230}
                />
                <h3>{x.nameRu}</h3>
                <span className="danger">{edibilityLabels[x.edibility]}</span>
                {[
                  ["Шляпка", x.capDescription],
                  ["Ножка", x.stemDescription],
                  ["Нижняя сторона", x.hymenophoreDescription],
                  ["Мякоть", x.fleshDescription],
                  ["Повреждение", x.damageReaction],
                ].filter(([, v]) => v && !v.startsWith("Требует провер")).map(([k, v]) => (
                  <p key={k}>
                    <strong>{k}</strong>
                    <br />
                    {v}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}
      </Modal>
      
    </article>
  );
}





