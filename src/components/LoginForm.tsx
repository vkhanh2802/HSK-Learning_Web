"use client";

import { usePathname } from "next/navigation";
import { useActionState } from "react";
import { login, logout } from "@/app/login/actions";
import { useT } from "./LangProvider";

export default function LoginForm({ next }: { next: string }) {
  const t = useT();
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-4 flex max-w-sm flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <label className="flex flex-col gap-1">
        {t("Mật khẩu", "Password")}
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          className="rounded border border-border bg-background px-3 py-2"
        />
      </label>
      {error && (
        <p role="alert" className="text-accent">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className="rounded bg-accent px-4 py-2 font-semibold text-background disabled:opacity-60">
        {pending ? t("Đang kiểm tra…", "Checking…") : t("Đăng nhập", "Sign in")}
      </button>
    </form>
  );
}

/** Nút đăng xuất trên thanh đầu trang (chỉ hiện khi bật đăng nhập). */
export function LogoutButton() {
  const t = useT();
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <form action={logout}>
      <button type="submit" className="rounded px-2 py-1 text-sm hover:bg-muted">
        {t("Đăng xuất", "Sign out")}
      </button>
    </form>
  );
}
