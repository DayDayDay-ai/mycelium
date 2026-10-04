"use client";
import { useState } from "react";
import Link from "next/link";
import { useLearning } from "./provider";
import { Button } from "./ui/button";
export function Account() {
  const { user, refresh, logout, guestCount, importGuest, ready } =
    useLearning();
  const [register, setRegister] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch(`/api/auth/${register ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          username: f.get("username"),
          usernameConfirm: f.get("usernameConfirm"),
          passwordConfirm: f.get("passwordConfirm"),
          password: f.get("password"),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.details?.[0]?.message || data.error);
      await refresh();
      setRegister(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="account-section">
      <div className="eyebrow">ТВОИ ЗНАНИЯ. С ТОБОЙ.</div>
      <h1>
        {user
          ? "Твой аккаунт"
          : register
            ? "Начни свой путь."
            : "С возвращением."}
      </h1>
      <p className="muted">Изучай сейчас. Продолжай с любого устройства.</p>
      {!ready ? (
        <p>Загрузка…</p>
      ) : user ? (
        <div className="account-card">
          <p>{user.name}</p>
          <p className="muted">@{user.username}</p>
          <p className="muted">
            {user.role === "ADMIN" ? "Администратор" : "Исследователь"}
          </p>
          {guestCount > 0 && (
            <div className="import-box">
              <p>Нашли {guestCount} изученных видов в браузере.</p>
              <Button disabled={busy} onClick={() => act(importGuest)}>
                Перенести локальный прогресс
              </Button>
            </div>
          )}
          {done && (
            <p className="acid" role="status">
              Готово
            </p>
          )}
          <Button asChild>
            <Link href="/progress">Мой прогресс ↗</Link>
          </Button>
          {user.role === "ADMIN" && (
            <Button asChild variant="outline">
              <Link href="/admin">Редактор каталога</Link>
            </Button>
          )}
          <Button variant="ghost" disabled={busy} onClick={() => act(logout)}>
            Выйти
          </Button>
        </div>
      ) : (
        <form key={register ? "register" : "login"} onSubmit={submit} className="account-card">
          {register && <label className="field">Имя<input name="name" required minLength={1} maxLength={80} autoComplete="name" placeholder="Как тебя зовут" /></label>}
          <label className="field">Ник<input name="username" required minLength={3} maxLength={30} pattern="[A-Za-z][A-Za-z0-9_]{2,29}" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Например, forest_explorer" /></label>
          <p className="muted">3–30 символов: латинские буквы, цифры и _. Начни с буквы. Регистр не имеет значения.</p>
          {register && <label className="field">Повтори ник<input name="usernameConfirm" required minLength={3} maxLength={30} pattern="[A-Za-z][A-Za-z0-9_]{2,29}" autoComplete="off" autoCapitalize="none" spellCheck={false} /></label>}
          <label className="field">
            Пароль
            <input
              type="password"
              name="password"
              required
              minLength={4}
              maxLength={72}
              autoComplete={register ? "new-password" : "current-password"}
              placeholder="Не менее 4 символов"
            />
          </label>
          {register && <label className="field">Повтори пароль<input type="password" name="passwordConfirm" required minLength={4} maxLength={72} autoComplete="new-password" /></label>}
          <Button disabled={busy} type="submit">
            {busy ? "Подождите…" : register ? "Создать аккаунт" : "Войти"} ↗
          </Button>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setRegister(!register);
              setError("");
            }}
          >
            {register
              ? "Уже есть аккаунт? Войти"
              : "Нет аккаунта? Зарегистрироваться"}
          </button>
          <Link className="muted" href="/mushrooms">
            Продолжить без регистрации ↗
          </Link>
        </form>
      )}
      {error && (
        <p className="danger" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

