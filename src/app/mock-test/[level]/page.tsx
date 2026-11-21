import Link from "next/link";
import { notFound } from "next/navigation";
import { startMockTest } from "@/app/actions";
import { prisma } from "@/lib/db";
import { BLUEPRINT, SKILL_VI, type SectionScore } from "@/lib/mock";
import { buildPool } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ level: string }> }) {
  const level = Number((await params).level);
  const spec = BLUEPRINT[level];
  if (!spec) notFound();

  const [pool, results] = await Promise.all([
    buildPool(level),
    prisma.mockResult.findMany({
      where: { mockTest: { levelId: level } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, createdAt: true, scores: true },
    }),
  ]);
  const minutes = spec.sections.reduce((m, s) => m + s.minutes, 0);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Thi thử HSK{level}</h1>
      <p className="mt-1 max-w-2xl text-sm opacity-75">
        Đề mô phỏng dạng đề HSK, câu hỏi bốc ngẫu nhiên từ kho bài tập HSK1–{level} (ưu tiên câu cấp {level} và câu chưa gặp
        trong 3 đề gần nhất). Mỗi phần quy về thang 100 điểm; đỗ khi tổng ≥ {spec.pass}/{spec.sections.length * 100}.
      </p>

      <table className="mt-4 text-left">
        <thead>
          <tr className="border-b border-border">
            <th className="py-1 pr-6">Phần</th>
            <th className="py-1 pr-6">Số câu</th>
            <th className="py-1 pr-6">Thời gian</th>
          </tr>
        </thead>
        <tbody>
          {spec.sections.map((s) => {
            const available = pool[s.skill].length;
            return (
              <tr key={s.skill} className="border-b border-border">
                <td className="py-1 pr-6">{SKILL_VI[s.skill]}</td>
                <td className="py-1 pr-6">
                  {Math.min(s.count, available)}
                  {available < s.count && <span className="text-sm opacity-75"> (đề thật {s.count}, kho mới có {available})</span>}
                </td>
                <td className="py-1 pr-6">{s.minutes} phút</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-sm opacity-75">
        Tổng {minutes} phút. Bài nghe được nghe tối đa {spec.maxPlays} lần mỗi câu. Không tải lại trang khi đang làm bài.
        {level >= 3 && " Phần Viết chưa có dạng đặt câu theo tranh (cần AI chấm, đang khoá)."}
      </p>

      <form action={startMockTest.bind(null, level)} className="mt-4">
        <button type="submit" className="rounded bg-accent px-5 py-2 font-semibold text-background">
          Làm đề mới
        </button>
      </form>

      <h2 className="mt-8 text-lg font-semibold">Lịch sử thi thử</h2>
      {results.length === 0 ? (
        <p className="mt-2 opacity-75">Chưa có lần thi nào.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {results.map((r) => {
            const s = JSON.parse(r.scores) as { sections: SectionScore[]; total: number; max: number; passed: boolean };
            return (
              <li key={r.id}>
                <Link href={`/mock-test/result/${r.id}`} className="hover:underline">
                  {r.createdAt.toLocaleString("vi-VN")} —{" "}
                  <strong>
                    {s.total}/{s.max}
                  </strong>{" "}
                  ({s.sections.map((p) => `${SKILL_VI[p.skill]} ${p.score}`).join(" · ")}){" "}
                  <span className={s.passed ? "text-green-600" : "text-accent"}>{s.passed ? "Đỗ" : "Chưa đỗ"}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
