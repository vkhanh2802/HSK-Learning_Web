import Link from "next/link";
import { notFound } from "next/navigation";
import { startMockTest } from "@/app/actions";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang-server";
import { tr } from "@/lib/lang";
import { formatDateTime } from "@/lib/time";
import { BLUEPRINT, SKILL_EN, SKILL_VI, type SectionScore } from "@/lib/mock";
import { buildPool } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ level: string }> }) {
  const lang = await getLang();
  const t = tr(lang);
  const skillName = (k: "listening" | "reading" | "writing") => t(SKILL_VI[k], SKILL_EN[k]);
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
      <h1 className="text-2xl font-bold">{t("Thi thử", "Mock test")} HSK{level}</h1>
      <p className="mt-1 max-w-2xl text-sm opacity-75">
        {t(
          `Đề mô phỏng dạng đề HSK, câu hỏi bốc ngẫu nhiên từ kho bài tập HSK1–${level} (ưu tiên câu cấp ${level} và câu chưa gặp trong 3 đề gần nhất). Mỗi phần quy về thang 100 điểm; đỗ khi tổng ≥ ${spec.pass}/${spec.sections.length * 100}.`,
          `A simulated HSK-style test with questions drawn at random from the HSK1–${level} exercise bank (preferring level-${level} questions and ones not seen in the last 3 tests). Each section is scored out of 100; you pass with a total of at least ${spec.pass}/${spec.sections.length * 100}.`,
        )}
      </p>

      <table className="mt-4 text-left">
        <thead>
          <tr className="border-b border-border">
            <th className="py-1 pr-6">{t("Phần", "Section")}</th>
            <th className="py-1 pr-6">{t("Số câu", "Questions")}</th>
            <th className="py-1 pr-6">{t("Thời gian", "Time")}</th>
          </tr>
        </thead>
        <tbody>
          {spec.sections.map((s) => {
            const available = pool[s.skill].length;
            return (
              <tr key={s.skill} className="border-b border-border">
                <td className="py-1 pr-6">{skillName(s.skill)}</td>
                <td className="py-1 pr-6">
                  {Math.min(s.count, available)}
                  {available < s.count && <span className="text-sm opacity-75"> {t(`(đề thật ${s.count}, kho mới có ${available})`, `(real test ${s.count}, bank has ${available})`)}</span>}
                </td>
                <td className="py-1 pr-6">{s.minutes} {t("phút", "min")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-sm opacity-75">
        {t(
          `Tổng ${minutes} phút. Bài nghe được nghe tối đa ${spec.maxPlays} lần mỗi câu. Không tải lại trang khi đang làm bài.`,
          `Total ${minutes} minutes. Each listening item can be played at most ${spec.maxPlays} times. Do not reload the page during the test.`,
        )}
        {level >= 3 && t(" Phần Viết chưa có dạng đặt câu theo tranh (cần AI chấm, đang khoá).", " The Writing section does not yet have picture-based sentence writing (needs AI grading, currently locked).")}
      </p>

      <form action={startMockTest.bind(null, level)} className="mt-4">
        <button type="submit" className="rounded bg-accent px-5 py-2 font-semibold text-background">
          {t("Làm đề mới", "Start a new test")}
        </button>
      </form>

      <h2 className="mt-8 text-2xl">{t("Lịch sử thi thử", "Test history")}</h2>
      {results.length === 0 ? (
        <p className="mt-2 opacity-75">{t("Chưa có lần thi nào.", "No tests taken yet.")}</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {results.map((r) => {
            const s = JSON.parse(r.scores) as { sections: SectionScore[]; total: number; max: number; passed: boolean };
            return (
              <li key={r.id}>
                <Link href={`/mock-test/result/${r.id}`} className="hover:underline">
                  {formatDateTime(r.createdAt, lang)} —{" "}
                  <strong>
                    {s.total}/{s.max}
                  </strong>{" "}
                  ({s.sections.map((p) => `${skillName(p.skill)} ${p.score}`).join(" · ")}){" "}
                  <span className={s.passed ? "text-green-600" : "text-accent"}>{s.passed ? t("Đỗ", "Passed") : t("Chưa đỗ", "Not passed")}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
