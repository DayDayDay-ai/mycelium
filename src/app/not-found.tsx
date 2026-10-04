import Link from "next/link";
export default function NotFound() {
  return (
    <div className="section">
      <div className="eyebrow">404</div>
      <h1>Этот путь ещё не открыт</h1>
      <Link href="/mushrooms" className="button button-primary">
        В каталог ↗
      </Link>
    </div>
  );
}
