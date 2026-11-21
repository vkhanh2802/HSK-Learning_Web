import Link from "next/link";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/lang-server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const t = await getT();
  const chars = await prisma.character.findMany({ orderBy: { id: "asc" }, select: { char: true, pinyin: true } });

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{t("Tập viết chữ Hán", "Hanzi writing practice")}</h1>
      <p className="mt-1 text-sm opacity-75">{t(`${chars.length} chữ trong từ vựng đã có. Chọn một chữ để xem thứ tự nét và tập viết.`, `${chars.length} characters in the vocabulary so far. Pick one to see its stroke order and practise writing it.`)}</p>
      <ul className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
        {chars.map((c) => (
          <li key={c.char}>
            <Link
              href={`/write/${c.char}`}
              className="flex flex-col items-center rounded border border-border p-2 hover:bg-muted"
            >
              <span lang="zh-CN" className="text-3xl">
                {c.char}
              </span>
              <span className="text-xs opacity-75">{c.pinyin}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
