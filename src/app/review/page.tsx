import Link from "next/link";
import ReviewSession, { type ReviewItem } from "@/components/ReviewSession";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/lang-server";
import { getWords } from "@/lib/words";

export const dynamic = "force-dynamic";

const LIMIT = 100;

export default async function Page() {
  const t = await getT();
  const cards = await prisma.reviewCard.findMany({
    where: { due: { lte: new Date() }, suspended: false, itemType: "word" },
    orderBy: { due: "asc" },
    take: LIMIT,
  });
  const words = new Map((await getWords([...new Set(cards.map((c) => c.itemId))])).map((w) => [w.id, w]));

  // Thẻ nghe: 3 phương án nhiễu là từ cùng cấp, cùng số chữ nếu đủ (khó đoán theo độ dài).
  // Bốc ngẫu nhiên ở server để client không bị lệch khi hydrate.
  const pool = await prisma.word.findMany({ select: { id: true, hanzi: true, levelId: true } });
  const distractors = (word: { id: number; hanzi: string }) => {
    const level = pool.find((p) => p.id === word.id)?.levelId;
    const same = pool.filter((p) => p.levelId === level && p.id !== word.id);
    const sameLen = same.filter((p) => [...p.hanzi].length === [...word.hanzi].length);
    const from = sameLen.length >= 3 ? sameLen : same;
    return [...from].sort(() => Math.random() - 0.5).slice(0, 3).map((p) => p.hanzi);
  };

  const items: ReviewItem[] = cards.flatMap((c) => {
    const word = words.get(c.itemId);
    if (!word) return [];
    const mode = c.mode as ReviewItem["mode"];
    const options =
      mode === "listen" ? [word.hanzi, ...distractors(word)].sort(() => Math.random() - 0.5) : undefined;
    return [{ cardId: c.id, mode, word, options }];
  });

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{t("Ôn tập", "Review")}</h1>
      {items.length === 0 ? (
        <p className="mt-4">
          {t("Không có thẻ nào đến hạn.", "No cards are due.")}{" "}
          <Link href="/learn/1" className="underline decoration-brush decoration-2 underline-offset-4">
            {t("Học bài mới", "Learn a new lesson")}
          </Link>
        </p>
      ) : (
        <ReviewSession items={items} />
      )}
    </main>
  );
}
