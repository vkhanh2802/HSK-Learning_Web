import type { Metadata, Viewport } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import { Instrument_Sans, Newsreader, Noto_Sans, Noto_Sans_SC } from "next/font/google";
import { LogoutButton } from "@/components/LoginForm";
import Nav from "@/components/Nav";
import ServiceWorker from "@/components/ServiceWorker";
import ThemeScript from "@/components/ThemeScript";
import ThemeToggle from "@/components/ThemeToggle";
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
        <ServiceWorker />
        <a
          href="#noi-dung"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-20 focus:rounded focus:bg-background focus:p-2"
        >
          {t("Bỏ qua tới nội dung", "Skip to content")}
        </a>
        <header>
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4">
            <Link href="/" className="font-serif text-2xl">
              学中文
            </Link>
            <Nav />
            <div className="ml-auto">
              <LangToggle />
            </div>
            <ThemeToggle />
            {authEnabled() && <LogoutButton />}
          </div>
        </header>
        <div id="noi-dung" tabIndex={-1} className="mx-auto max-w-5xl outline-none">
          {children}
        </div>
        </LangProvider>
      </body>
    </html>
  );
}
