import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, authEnabled, verifySessionValue } from "@/lib/auth";

/**
 * Khi bật đăng nhập (có APP_PASSWORD): mọi trang, server action và API đều cần cookie session hợp lệ.
 * Đây là lớp chặn duy nhất cần có vì web chỉ có một người dùng và mọi đường vào dữ liệu đều đi qua đây.
 */
export function proxy(request: NextRequest) {
  if (!authEnabled()) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  if (pathname === "/login") return NextResponse.next();
  if (verifySessionValue(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  // API / server action trả 401 thay vì chuyển trang.
  if (pathname.startsWith("/api/") || request.method !== "GET")
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Bỏ qua file tĩnh: code/ảnh của Next, ảnh minh hoạ, icon, manifest và service worker (trình duyệt tải manifest không kèm cookie).
  matcher: ["/((?!_next/static|_next/image|images/|icons/|favicon.ico|apple-icon.png|manifest.webmanifest|sw.js).*)"],
};
