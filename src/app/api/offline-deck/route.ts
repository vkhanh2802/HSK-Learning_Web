import { prisma } from "@/lib/db";
import type { Example } from "@/lib/words";
import { hasSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Bộ từ để ôn khi mất mạng (service worker lưu lại): các từ đã có thẻ ôn, từ đến hạn sớm nhất trước.
 * Chưa học từ nào thì trả từ vựng HSK1 để vẫn có thứ để ôn.
 */
export async function GET() {
  if (!(await hasSession())) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const cards = await prisma.reviewCard.findMany({
    where: { itemType: "word", suspended: false },
    select: { itemId: true, due: true },
  });
  const due = new Map<number, Date>();
  for (const c of cards) if (!due.has(c.itemId) || c.due < due.get(c.itemId)!) due.set(c.itemId, c.due);

  const select = { id: true, hanzi: true, pinyin: true, meaningVi: true, examples: true } as const;
  const words = due.size
    ? (await prisma.word.findMany({ select })).filter((w) => due.has(w.id))
    : await prisma.word.findMany({ where: { levelId: 1 }, select, orderBy: { id: "asc" } });
  words.sort((a, b) => (due.get(a.id)?.getTime() ?? 0) - (due.get(b.id)?.getTime() ?? 0));

  return Response.json({
    learned: due.size > 0,
    savedAt: new Date().toISOString(),
    words: words.map((w) => ({
      hanzi: w.hanzi,
      pinyin: w.pinyin,
      vi: w.meaningVi,
      example: (JSON.parse(w.examples) as Example[])[0] ?? null,
    })),
  });
}
