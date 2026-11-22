import Link from "next/link";
import { notFound } from "next/navigation";
import WritePractice from "@/components/WritePractice";
import { prisma } from "@/lib/db";
import { meaning } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { tr } from "@/lib/lang";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ char: string }> }) {
  const lang = await getLang();
  const t = tr(lang);
  const { char: rawParam } = await params;
  // Next.js trả param chữ Hán ở dạng còn mã hoá (%E6%88%91); URL lỗi thì giữ nguyên thay vì 500.
  let text = rawParam;
  try {
    text = decodeURIComponent(rawParam);
  } catch {}
  const char = [...text][0] ?? "";
  if (!/\p{Script=Han}/u.test(char)) notFound();

  const [info, all] = await Promise.all([
    prisma.character.findUnique({
      where: { char },
      include: { words: { include: { word: true }, orderBy: { word: { id: "asc" } } } },
    }),
    prisma.character.findMany({ select: { char: true }, orderBy: { id: "asc" } }),
  ]);
  const idx = all.findIndex((c) => c.char === char);
  const prev = idx > 0 ? all[idx - 1].char : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1].char : null;

  return (
    <main className="p-8">
      <Link href="/write" className="text-sm opacity-75">
        ← {t("Tất cả chữ", "All characters")}
      </Link>
      <h1 className="mt-1 flex items-baseline gap-3 text-2xl font-bold">
        {t("Viết chữ", "Write")}{" "}
        <span lang="zh-CN" className="text-4xl">
          {char}
        </span>
        {info && <span className="text-xl font-normal">{info.pinyin}</span>}
      </h1>
      {info?.radical && <p className="mt-1 text-sm">{t("Bộ thủ:", "Radical:")} <span lang="zh-CN">{info.radical}</span></p>}

      <div className="mt-4 flex flex-col gap-6 md:flex-row">
        <WritePractice char={char} />
        {info && info.words.length > 0 && (
          <section>
            <h2 className="font-semibold">{t("Từ có chữ này", "Words with this character")}</h2>
            <ul className="mt-2 space-y-1">
              {info.words.map(({ word }) => (
                <li key={word.id}>
                  <span lang="zh-CN" className="text-lg">
                    {word.hanzi}
                  </span>{" "}
                  {word.pinyin} — {meaning(lang, word)}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <nav aria-label={t("Chữ trước và sau", "Previous and next character")} className="mt-6 flex gap-3">
        {prev && (
          <Link href={`/write/${prev}`} className="rounded border border-border px-3 py-1.5 hover:bg-muted">
            ← <span lang="zh-CN">{prev}</span>
          </Link>
        )}
        {next && (
          <Link href={`/write/${next}`} className="rounded border border-border px-3 py-1.5 hover:bg-muted">
            <span lang="zh-CN">{next}</span> →
          </Link>
        )}
      </nav>
    </main>
  );
}
