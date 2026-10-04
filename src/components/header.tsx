"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Sprout } from "lucide-react";
import { useLearning } from "./provider";
export function Header() {
  const { user, progress } = useLearning();
  const path = usePathname();
  const count = Object.values(progress).filter(
    (x) => x.status === "STUDIED",
  ).length;
  return (
    <header className="header">
      <Link href="/" className="brand">
        <Sprout size={27} /> MYCELIUM<span className="brand-dot">®</span>
      </Link>
      <nav aria-label="Главная навигация">
        <Link
          className={path.startsWith("/mushrooms") ? "active" : ""}
          href="/mushrooms"
        >
          Каталог <span className="nav-small">↗</span>
        </Link>
        <Link className={path === "/progress" ? "active" : ""} href="/progress">
          Мой прогресс <span className="counter">{count}</span>
        </Link>
        {user?.role === "ADMIN" && <Link href="/admin">Админ</Link>}
      </nav>
      <Link className="account" href="/account">
        {user ? "Аккаунт" : "Войти"} <ArrowUpRight size={16} />
      </Link>
    </header>
  );
}
