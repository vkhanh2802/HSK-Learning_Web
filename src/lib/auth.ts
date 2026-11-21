// Đăng nhập một người dùng bằng mật khẩu (bản deploy). Bật khi có biến môi trường APP_PASSWORD;
// không có (chạy local) thì web mở như trước. Session là cookie ký HMAC, không cần bảng trong DB.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "session";
export const SESSION_DAYS = 30;

export const authEnabled = () => !!process.env.APP_PASSWORD;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("Thiếu AUTH_SECRET (≥ 32 ký tự) — bắt buộc khi đặt APP_PASSWORD");
  return s;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

const sameBytes = (a: Buffer, b: Buffer) => a.length === b.length && timingSafeEqual(a, b);

/** So mật khẩu theo thời gian hằng (băm trước để hai chuỗi cùng độ dài). */
export function checkPassword(input: string): boolean {
  const want = process.env.APP_PASSWORD;
  if (!want) return false;
  const h = (s: string) => createHash("sha256").update(s).digest();
  return sameBytes(h(input), h(want));
}

/** Giá trị cookie: "<hạn ms>.<chữ ký>". */
export function createSessionValue(now = Date.now()): string {
  const exp = String(now + SESSION_DAYS * 86_400_000);
  return `${exp}.${sign(exp)}`;
}

export function verifySessionValue(value: string | undefined, now = Date.now()): boolean {
  if (!value) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < now) return false;
  return sameBytes(Buffer.from(sig), Buffer.from(sign(exp)));
}

/** Chỉ cho chuyển hướng tới đường dẫn nội bộ ("/..." nhưng không phải "//..." sang trang khác). */
export const safeNext = (next: string | null | undefined) => (next && /^\/(?![/\\])/.test(next) ? next : "/");
