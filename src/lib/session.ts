import { cookies } from "next/headers";
import { SESSION_COOKIE, authEnabled, verifySessionValue } from "@/lib/auth";

/** Đã đăng nhập (hoặc không bật đăng nhập). Dùng trong server action / route handler / server component. */
export async function hasSession(): Promise<boolean> {
  return !authEnabled() || verifySessionValue((await cookies()).get(SESSION_COOKIE)?.value);
}

/**
 * Lớp kiểm tra thứ hai ngoài proxy: server action được gọi theo mã action chứ không theo đường dẫn,
 * nên một POST tới /login (đường proxy cho qua) vẫn có thể gọi action khác — mọi action đọc/ghi dữ liệu phải gọi hàm này.
 */
export async function requireSession(): Promise<void> {
  if (!(await hasSession())) throw new Error("Chưa đăng nhập");
}
