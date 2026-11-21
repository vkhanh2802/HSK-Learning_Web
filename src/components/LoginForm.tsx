"use client";

import { usePathname } from "next/navigation";
import { useActionState } from "react";
import { login, logout } from "@/app/login/actions";

export default function LoginForm({ next }: { next: string }) {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-4 flex max-w-sm flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <label className="flex flex-col gap-1">
        Mật khẩu
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
        {pending ? "Đang kiểm tra…" : "Đăng nhập"}
      </button>
    </form>
  );
}

/** Nút đăng xuất trên thanh đầu trang (chỉ hiện khi bật đăng nhập). */
export function LogoutButton() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <form action={logout}>
      <button type="submit" className="rounded px-2 py-1 text-sm hover:bg-muted">
        Đăng xuất
      </button>
    </form>
  );
}
