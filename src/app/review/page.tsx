import Link from "next/link";
import ReviewSession, { type ReviewItem } from "@/components/ReviewSession";
import { prisma } from "@/lib/db";
import { getWords } from "@/lib/words";

export const dynamic = "force-dynamic";

const LIMIT = 100;

export default async function Page() {
  const cards = await prisma.reviewCard.findMany({
    where: { due: { lte: new Date() }, suspended: false, itemType: "word" },
    orderBy: { due: "asc" },
    take: LIMIT,
  });
  const words = new Map((await getWords([...new Set(cards.map((c) => c.itemId))])).map((w) => [w.id, w]));
  const items: ReviewItem[] = cards.flatMap((c) => {
    const word = words.get(c.itemId);
    return word ? [{ cardId: c.id, mode: c.mode as ReviewItem["mode"], word }] : [];
  });

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Ôn tập</h1>
      {items.length === 0 ? (
        <p className="mt-4">
          Không có thẻ nào đến hạn. <Link href="/learn/1" className="text-accent underline">Học bài mới</Link>
        </p>
      ) : (
        <ReviewSession items={items} />
      )}
    </main>
  );
}
