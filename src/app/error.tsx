"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="section">
      <h1>Не удалось загрузить данные</h1>
      <p className="muted">
        Проверьте подключение к базе данных и попробуйте снова.
      </p>
      <Button onClick={reset}>Повторить</Button>
    </div>
  );
}
