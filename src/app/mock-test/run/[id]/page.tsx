import { notFound, redirect } from "next/navigation";
import MockTestRunner from "@/components/MockTestRunner";
import { prisma } from "@/lib/db";
import { BLUEPRINT } from "@/lib/mock";
import { loadItems, toClient, type Section } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const test = Number.isInteger(id)
    ? await prisma.mockTest.findUnique({ where: { id }, include: { results: { select: { id: true } } } })
    : null;
  if (!test) notFound();
  if (test.results.length) redirect(`/mock-test/result/${test.results[0].id}`);

  const sections = JSON.parse(test.sections) as Section[];
  const items = new Map((await loadItems(sections.flatMap((s) => s.items))).map((i) => [i.ref, i]));

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Thi thử HSK{test.levelId}</h1>
      {/* Đáp án không gửi xuống client; chấm cả bài ở server action submitMockTest. */}
      <MockTestRunner
        testId={test.id}
        level={test.levelId}
        maxPlays={BLUEPRINT[test.levelId].maxPlays}
        sections={sections.map((s) => ({
          skill: s.skill,
          minutes: s.minutes,
          items: s.items.flatMap((ref) => {
            const item = items.get(ref);
            return item ? [toClient(item)] : [];
          }),
        }))}
      />
    </main>
  );
}
