import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Admin } from "@/components/admin";
export const dynamic = "force-dynamic";
export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/account");
  if (user.role !== "ADMIN")
    return (
      <section className="section">
        <h1>Доступ ограничен</h1>
        <p>Эта страница доступна администратору.</p>
      </section>
    );
  return <Admin />;
}
