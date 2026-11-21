import Link from "next/link";
import { notFound } from "next/navigation";
import PassageQuestions from "@/components/PassageQuestions";
import Reader from "@/components/Reader";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/lang-server";
import { stripAnswers, type Question, type Token } from "@/lib/passages";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const id = Number((await params).id);
  const passage = Number.isInteger(id) ? await prisma.passage.findUnique({ where: { id } }) : null;
  if (!passage) notFound();

  const lines = JSON.parse(passage.tokens) as Token[][];
  const wordIds = [...new Set(lines.flat().flatMap((t) => (t.w === undefined ? [] : [t.w])))];
  const cards = await prisma.reviewCard.findMany({
    where: { itemType: "word", itemId: { in: wordIds } },
    distinct: ["itemId"],
    select: { itemId: true },
  });
  const [prev, next] = await Promise.all([
    prisma.passage.findFirst({ where: { levelId: passage.levelId, key: { lt: passage.key } }, orderBy: { key: "desc" } }),
    prisma.passage.findFirst({ where: { levelId: passage.levelId, key: { gt: passage.key } }, orderBy: { key: "asc" } }),
  ]);

  return (
    <main className="p-8">
      <Link href="/reading" className="text-sm opacity-75 hover:underline">
        ← {t("Bài đọc", "Reading")} HSK{passage.levelId}
      </Link>
      <h1 className="mt-1 text-2xl font-bold">{passage.title}</h1>
      <p className="mb-4 text-sm opacity-75">{passage.type === "dialogue" ? t("Hội thoại", "Dialogue") : t("Đoạn văn", "Paragraph")}</p>

      <Reader
        key={passage.id}
        lines={lines}
        translation={passage.translation}
        pinyinDefault={passage.levelId <= 2}
        inReview={cards.map((c) => c.itemId)}
      />
      {/* Đáp án không gửi xuống client; chấm ở server action submitReading. */}
      <PassageQuestions
        key={`q-${passage.id}`}
        passageId={passage.id}
        questions={stripAnswers(JSON.parse(passage.questions) as Question[])}
      />

      <nav aria-label={t("Bài trước và sau", "Previous and next passage")} className="mt-8 flex gap-3">
        {prev && (
          <Link href={`/reading/${prev.id}`} className="rounded border border-border px-3 py-1.5 hover:bg-muted">
            ← {prev.title}
          </Link>
        )}
        {next && (
          <Link href={`/reading/${next.id}`} className="rounded border border-border px-3 py-1.5 hover:bg-muted">
            {next.title} →
          </Link>
        )}
      </nav>
    </main>
  );
}
