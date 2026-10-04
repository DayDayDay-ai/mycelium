import { Suspense } from "react";
import { Catalog } from "@/components/catalog";
export const metadata = { title: "Каталог грибов" };
export default function Page() {
  return (
    <Suspense fallback={<div className="section">Загрузка каталога…</div>}>
      <Catalog />
    </Suspense>
  );
}
