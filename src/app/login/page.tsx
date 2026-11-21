import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { authEnabled, safeNext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!authEnabled()) redirect("/");
  const next = safeNext((await searchParams).next);
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Đăng nhập</h1>
      <p className="mt-1 text-sm opacity-75">Nhập mật khẩu của web để tiếp tục học.</p>
      <LoginForm next={next} />
    </main>
  );
}
