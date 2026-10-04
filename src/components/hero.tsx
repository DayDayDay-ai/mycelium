"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowUpRight, ArrowDown, MoveUpRight } from "lucide-react";
import { Button } from "./ui/button";
const Viewer = dynamic(() => import("./viewer"), {
  ssr: false,
  loading: () => <div className="viewer" />,
});
export function Hero() {
  return (
    <>
      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" /> A NEW WAY TO EXPLORE NATURE
          </div>
          <h1>
            ЛЕС ЖДЁТ.
            <br />
            ТЫ <span>ГОТОВ?</span>
          </h1>
          <p>
            Научись видеть больше.
            <br />
            Изучай грибы в 3D, различай двойников
            <br />и отправляйся в лес подготовленным.
          </p>
          <Button asChild>
            <Link href="/mushrooms">
              Начать изучать <ArrowUpRight />
            </Link>
          </Button>
          <div className="hero-note">
            <span>01 — ∞</span> Твоя новая территория знаний
          </div>
        </div>
        <div className="hero-art">
          <div className="orbit-circle" />
          <div className="hero-index">
            AMANITA
            <br />
            <span>MUSCARIA</span>
          </div>
          <Viewer hero color="#ef4437" shape="amanita" />
          <div className="specimen-tag">
            <span className="live-dot" /> ОБРАЗЕЦ 006{" "}
            <span className="danger">ЯДОВИТЫЙ</span>
          </div>
        </div>
        <div className="hero-bottom">
          <span>МЕНЬШЕ СЛУЧАЙНОСТЕЙ. БОЛЬШЕ ЗНАНИЙ.</span>
          <a href="#how" aria-label="Как устроено обучение">
            <ArrowDown size={18} />
          </a>
          <span>SCROLL TO DISCOVER</span>
        </div>
      </section>
      <div className="ticker">
        EXPLORE THE UNKNOWN <span>✳</span> KNOW YOUR MUSHROOMS <span>✳</span>{" "}
        STAY CURIOUS <span>✳</span> EXPLORE THE UNKNOWN
      </div>
      <section id="how" className="section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">ТВОЙ ПЕРВЫЙ МАРШРУТ</div>
            <h2>
              ЗНАНИЯ.
              <br />
              <span className="muted">НЕ УДАЧА.</span>
            </h2>
          </div>
          <p className="muted">
            Пять шагов от любопытства
            <br />к осознанному исследованию.
          </p>
        </div>
        <div className="steps">
          {[
            "Изучай",
            "Вращай",
            "Сравнивай",
            "Запоминай",
            "Будь подготовлен",
          ].map((x, i) => (
            <div key={x}>
              <span>0{i + 1}</span>
              <MoveUpRight />
              <h3>{x}</h3>
              <p>
                {
                  [
                    "Смотри на каждый признак.",
                    "Рассмотри со всех сторон.",
                    "Узнай похожие виды.",
                    "Отмечай изученное.",
                    "Подтверди знания с экспертом.",
                  ][i]
                }
              </p>
            </div>
          ))}
        </div>
        <div className="level-banner">
          <span className="level-number">10</span>
          <div>
            <div className="eyebrow">НОВАЯ ЦЕЛЬ</div>
            <h3>Начинающий грибник</h3>
            <p className="muted">
              Изучи 10 видов, чтобы открыть следующий уровень.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/progress">
              Мой прогресс <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
