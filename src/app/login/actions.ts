"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_DAYS, authEnabled, checkPassword, createSessionValue, safeNext } from "@/lib/auth";

export async function login(_prev: string | null, form: FormData): Promise<string | null> {
  if (!authEnabled()) redirect("/");
  const password = String(form.get("password") ?? "");
  if (!checkPassword(password)) {
    // Chậm lại một chút để đoán mật khẩu tốn thời gian hơn.
    await new Promise((r) => setTimeout(r, 800));
    return "Sai mật khẩu.";
  }
  (await cookies()).set(SESSION_COOKIE, createSessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
  redirect(safeNext(String(form.get("next") ?? "")));
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
