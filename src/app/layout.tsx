import type { Metadata, Viewport } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import { Instrument_Sans, Newsreader, Noto_Sans, Noto_Sans_SC } from "next/font/google";
import { LogoutButton } from "@/components/LoginForm";
import Nav from "@/components/Nav";
import ServiceWorker from "@/components/ServiceWorker";
import ThemeScript from "@/components/ThemeScript";
import ThemeToggle from "@/components/ThemeToggle";
import VolumeSlider from "@/components/VolumeSlider";
import { LangProvider } from "@/components/LangProvider";
import LangToggle from "@/components/LangToggle";
import { authEnabled } from "@/lib/auth";
import { getLang, getT } from "@/lib/lang-server";
import "./globals.css";

// Noto Sans cho chữ Latin/tiếng Việt/pinyin (glyph ā ē ī ō ū của Noto Sans SC đặt dấu lệch);
// Noto Sans SC lo chữ Hán, glyph CJK tải theo unicode-range khi cần.
const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin", "latin-ext", "vietnamese"],
});
const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
});

const newSpirit = localFont({ src: "../font/New Spirit Regular.otf", variable: "--font-new-spirit", weight: "400", display: "swap" });
const instrument = Instrument_Sans({ variable: "--font-instrument", subsets: ["latin", "latin-ext"] });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin", "latin-ext", "vietnamese"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Học tiếng Trung HSK1–HSK4", "Learn Chinese HSK1–HSK4"),
    description: t(
      "Học tiếng Trung từ HSK1 đến HSK4 với đủ 4 kỹ năng Nghe, Nói, Đọc, Viết",
      "Learn Chinese from HSK1 to HSK4 with all four skills: listening, speaking, reading and writing",
    ),
    appleWebApp: { capable: true, title: "学中文" },
  };
}

export const viewport: Viewport = { themeColor: "#3b2c20" };

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getLang();
  const t = await getT();
  return (
    <html lang={lang} className={`${instrument.variable} ${newSpirit.variable} ${newsreader.variable} ${notoSans.variable} ${notoSansSC.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <LangProvider lang={lang}>
        <ThemeScript />
        <div aria-hidden className="bg-photo" />
        <ServiceWorker />
        <a
          href="#noi-dung"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-20 focus:rounded focus:bg-background focus:p-2"
        >
          {t("Bỏ qua tới nội dung", "Skip to content")}
        </a>
        <header className="sticky top-0 z-20 px-6 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr]">
            <Link
              href="/"
              aria-label={t("Trang chủ", "Home")}
              title={t("Trang chủ", "Home")}
              className="glass inline-flex items-center justify-center justify-self-start rounded-full px-3.5 py-2.5 transition hover:scale-105"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H11v15H5.5A2.5 2.5 0 0 0 3 21.5z" fill="currentColor" fillOpacity="0.12" />
                <path d="M21 6.5A2.5 2.5 0 0 0 18.5 4H13v15h5.5a2.5 2.5 0 0 1 2.5 2.5z" fill="currentColor" fillOpacity="0.12" />
                <path d="M12 4v15" />
                <path d="M15.5 8.5h2.5M15.5 12h2.5M6 8.5h2.5M6 12h2.5" />
              </svg>
            </Link>
            <Nav />
            <div className="glass flex items-center gap-3 justify-self-end whitespace-nowrap rounded-full px-3 py-2">
              <VolumeSlider />
              <LangToggle />
              <ThemeToggle />
              {authEnabled() && <LogoutButton />}
            </div>
          </div>
        </header>
        <div id="noi-dung" tabIndex={-1} className="mx-auto max-w-5xl px-3 pb-6 pt-3 outline-none">
          {children}
        </div>
        </LangProvider>
      </body>
    </html>
  );
}
