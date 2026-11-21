"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "./LangProvider";

type NavLink = { href: string; label: [vi: string, en: string] };
type NavItem = NavLink | { label: [vi: string, en: string]; children: NavLink[] };

const levels = [1, 2, 3, 4];
const hsk = (n: number): NavLink => ({ href: `/mock-test/${n}`, label: [`HSK${n}`, `HSK${n}`] });

const items: NavItem[] = [
  { href: "/", label: ["Trang chủ", "Home"] },
  {
    label: ["Học", "Learn"],
    children: [
      ...levels.map((n): NavLink => ({ href: `/learn/${n}`, label: [`HSK${n}`, `HSK${n}`] })),
      { href: "/pinyin", label: ["Bảng pinyin", "Pinyin chart"] },
      { href: "/tones", label: ["Thanh điệu", "Tones"] },
      { href: "/write", label: ["Tập viết", "Writing practice"] },
      { href: "/radicals", label: ["Bộ thủ", "Radicals"] },
      { href: "/offline", label: ["Ôn offline", "Offline review"] },
    ],
  },
  { href: "/review", label: ["Ôn tập", "Review"] },
  {
    label: ["Kỹ năng", "Skills"],
    children: [
      { href: "/listening", label: ["Nghe", "Listening"] },
      { href: "/speaking", label: ["Nói", "Speaking"] },
      { href: "/reading", label: ["Đọc", "Reading"] },
      { href: "/writing", label: ["Viết", "Writing"] },
    ],
  },
  { href: "/grammar", label: ["Ngữ pháp", "Grammar"] },
  { label: ["Thi thử", "Mock tests"], children: levels.map(hsk) },
  { href: "/stats", label: ["Thống kê", "Stats"] },
];

const section = (href: string) => href.split("/")[1];

export default function Nav() {
  const pathname = usePathname();
  const i = useLang() === "en" ? 1 : 0;
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : section(pathname) === section(href);

  const linkClass = (active: boolean) =>
    `motion-nav-link block rounded-full px-3 py-1 hover:bg-muted ${active ? "font-semibold" : ""}`;

  return (
    <nav aria-label={i ? "Main navigation" : "Điều hướng chính"}>
      <ul className="flex flex-wrap items-center gap-1">
        {items.map((item) =>
          "href" in item ? (
            <li key={item.label[0]}>
              <Link
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                data-active={isActive(item.href)}
                className={linkClass(isActive(item.href))}
              >
                {item.label[i]}
              </Link>
            </li>
          ) : (
            <li key={item.label[0]}>
              {/* key theo pathname để menu tự đóng sau khi chuyển trang */}
              <details key={pathname} className="motion-nav-details relative">
                <summary
                  data-active={item.children.some((c) => isActive(c.href))}
                  className={`${linkClass(item.children.some((c) => isActive(c.href)))} cursor-pointer list-none`}
                >
                  {item.label[i]}
                  <svg aria-hidden="true" className="motion-nav-chevron" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m3 4.5 3 3 3-3" />
                  </svg>
                </summary>
                <ul className="motion-nav-menu absolute left-0 z-10 mt-1 min-w-40 rounded-xl border border-border bg-background p-1 shadow-lg">
                  {item.children.map((c) => (
                    <li key={c.href}>
                      <Link
                        href={c.href}
                        aria-current={pathname === c.href ? "page" : undefined}
                        data-active={pathname === c.href}
                        className={linkClass(pathname === c.href)}
                      >
                        {c.label[i]}
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
