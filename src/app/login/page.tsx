import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { authEnabled, safeNext } from "@/lib/auth";
import { getT } from "@/lib/lang-server";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!authEnabled()) redirect("/");
  const t = await getT();
  const next = safeNext((await searchParams).next);
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{t("Đăng nhập", "Sign in")}</h1>
      <p className="mt-1 text-sm opacity-75">{t("Nhập mật khẩu của web để tiếp tục học.", "Enter the site password to keep learning.")}</p>
      <LoginForm next={next} />
    </main>
  );
}
