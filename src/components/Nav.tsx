"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string };
type NavItem = NavLink | { label: string; children: NavLink[] };

const levels = [1, 2, 3, 4];

// shortcut: Ngữ pháp trỏ tới mục số 1 vì chưa có trang danh sách; thêm trang danh sách ở Phase 7.
const items: NavItem[] = [
  { href: "/", label: "Trang chủ" },
  {
    label: "Học",
    children: [
      ...levels.map((n) => ({ href: `/learn/${n}`, label: `HSK${n}` })),
      { href: "/pinyin", label: "Bảng pinyin" },
      { href: "/tones", label: "Thanh điệu" },
      { href: "/write", label: "Tập viết" },
      { href: "/radicals", label: "Bộ thủ" },
    ],
  },
  { href: "/review", label: "Ôn tập" },
  {
    label: "Kỹ năng",
    children: [
      { href: "/listening", label: "Nghe" },
      { href: "/speaking", label: "Nói" },
      { href: "/reading", label: "Đọc" },
      { href: "/writing", label: "Viết" },
    ],
  },
  { href: "/grammar/1", label: "Ngữ pháp" },
  {
    label: "Thi thử",
    children: levels.map((n) => ({ href: `/mock-test/${n}`, label: `HSK${n}` })),
  },
];

const section = (href: string) => href.split("/")[1];

export default function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : section(pathname) === section(href);

  const linkClass = (active: boolean) =>
    `block rounded px-2 py-1 hover:bg-muted ${active ? "font-semibold text-accent" : ""}`;

  return (
    <nav aria-label="Điều hướng chính">
      <ul className="flex flex-wrap items-center gap-1">
        {items.map((item) =>
          "href" in item ? (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={linkClass(isActive(item.href))}
              >
                {item.label}
              </Link>
            </li>
          ) : (
            <li key={item.label}>
              {/* key theo pathname để menu tự đóng sau khi chuyển trang */}
              <details key={pathname} className="relative">
                <summary
                  className={`${linkClass(item.children.some((c) => isActive(c.href)))} cursor-pointer list-none`}
                >
                  {item.label} ▾
                </summary>
                <ul className="absolute left-0 z-10 mt-1 min-w-40 rounded border border-border bg-background p-1 shadow-lg">
                  {item.children.map((c) => (
                    <li key={c.href}>
                      <Link
                        href={c.href}
                        aria-current={pathname === c.href ? "page" : undefined}
                        className={linkClass(pathname === c.href)}
                      >
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
