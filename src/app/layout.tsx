import type { Metadata } from "next";
import "./globals.css";
import { Provider } from "@/components/provider";
import { Header } from "@/components/header";
import { warning } from "@/lib/constants";
export const metadata: Metadata = {
  title: {
    default: "MYCELIUM — Лес ждёт. Ты готов?",
    template: "%s · MYCELIUM",
  },
  description: "Изучай грибы, вращай 3D-модели и узнавай опасных двойников.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body>
        <Provider>
          <Header />
          <main>{children}</main>
          <footer>
            <div className="footer-brand">
              MYCELIUM® <span>STAY CURIOUS. STAY SAFE.</span>
            </div>
            <p className="safety">⚠ {warning}</p>
            <div className="footer-bottom">
              <span>Образовательный проект · 2026</span>
              <span>Познавай. Сравнивай. Береги себя.</span>
            </div>
          </footer>
        </Provider>
      </body>
    </html>
  );
}
