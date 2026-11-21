import Link from "next/link";
import { ActivityHeatmap, ForecastChart } from "@/components/Charts";
import { BackupPanel, RelearnButton } from "@/components/StatsActions";
import { prisma } from "@/lib/db";
import { streak } from "@/lib/streak";
import { MASTERED_DAYS, SKILL_NAMES, accuracyBySkill, forecast, heatmap, isMastered } from "@/lib/stats";

export const dynamic = "force-dynamic";

type Fsrs = { stability: number; lapses: number };

export default async function Page() {
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 86_400_000);
  const since26w = new Date(now.getTime() - 26 * 7 * 86_400_000);

  const [cards, recent, activity, lessonsDone, levels, words] = await Promise.all([
    prisma.reviewCard.findMany({ where: { itemType: "word" }, select: { itemId: true, fsrs: true, due: true, suspended: true } }),
    prisma.attempt.findMany({ where: { createdAt: { gte: since30 } }, select: { skill: true, correct: true } }),
    prisma.attempt.findMany({ where: { createdAt: { gte: since26w } }, select: { createdAt: true } }),
    prisma.lesson.findMany({ where: { doneAt: { not: null } }, select: { doneAt: true } }),
    prisma.level.findMany({ orderBy: { id: "asc" }, select: { id: true, name: true } }),
    prisma.word.findMany({ select: { id: true, hanzi: true, pinyin: true, meaningVi: true, levelId: true } }),
  ]);

  const days = forecast(
    cards.filter((c) => !c.suspended).map((c) => c.due),
    now,
  );
  const { rows: skills, weakest } = accuracyBySkill(recent);
  const dates = [...activity.map((a) => a.createdAt), ...lessonsDone.map((l) => l.doneAt!)];
  const grid = heatmap(dates, now);
  const streakDays = streak(dates, now);

  // Theo từ: độ ổn định của từng thẻ và tổng số lần quên (lapses).
  const byWord = new Map<number, { stab: number[]; lapses: number }>();
  for (const c of cards) {
    const f = JSON.parse(c.fsrs) as Fsrs;
    const w = byWord.get(c.itemId) ?? { stab: [], lapses: 0 };
    w.stab.push(f.stability);
    w.lapses += f.lapses;
    byWord.set(c.itemId, w);
  }
  const vocab = levels.map((l) => {
    const mine = words.filter((w) => w.levelId === l.id);
    const learned = mine.filter((w) => byWord.has(w.id));
    const mastered = learned.filter((w) => isMastered(byWord.get(w.id)!.stab)).length;
    return { ...l, total: mine.length, learned: learned.length, mastered };
  });
  const leeches = words
    .map((w) => ({ ...w, lapses: byWord.get(w.id)?.lapses ?? 0 }))
    .filter((w) => w.lapses > 0)
    .sort((a, b) => b.lapses - a.lapses)
    .slice(0, 20);
  const pct = (n: number, d: number) => (d ? `${(n / d) * 100}%` : "0%");

  return (
    <main className="max-w-4xl p-8">
      <h1 className="text-2xl font-bold">Thống kê</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Thẻ ôn 30 ngày tới</h2>
        <p className="text-sm opacity-75">Số thẻ đến hạn mỗi ngày — biết trước ngày nào ôn nhiều để chia bớt bài mới.</p>
        <div className="mt-3">
          <ForecastChart data={days} />
        </div>
        <details className="mt-1 text-sm">
          <summary className="cursor-pointer opacity-75">Xem dạng bảng</summary>
          <table className="mt-2 tabular-nums">
            <tbody>
              {days
                .filter((d) => d.count)
                .map((d) => (
                  <tr key={d.date}>
                    <td className="pr-4">{d.date}</td>
                    <td className="text-right">{d.count} thẻ</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Độ chính xác theo kỹ năng (30 ngày)</h2>
        <p className="text-sm opacity-75">
          Tính từ mọi lượt làm bài: ôn thẻ, luyện nghe/nói/đọc/viết, ngữ pháp, thi thử.
          {weakest && (
            <>
              {" "}
              Yếu nhất: <strong>{SKILL_NAMES[weakest]}</strong>.
            </>
          )}
        </p>
        <ul className="mt-3 space-y-2">
          {skills.map((s) => (
            <li key={s.skill} className="grid grid-cols-[6rem_1fr_9rem] items-center gap-3">
              <span>
                {SKILL_NAMES[s.skill]}
                {s.skill === weakest && <span className="ml-1 text-xs opacity-75">(yếu nhất)</span>}
              </span>
              <span className="h-2 rounded-full" style={{ background: "var(--viz-track)" }}>
                <span
                  className="block h-2 rounded-full"
                  style={{ width: s.rate === null ? 0 : `${s.rate * 100}%`, background: "var(--viz-bar)" }}
                />
              </span>
              <span className="text-sm tabular-nums">
                {s.rate === null ? "chưa có" : `${Math.round(s.rate * 100)}% · ${s.total} lượt`}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Tiến độ từ vựng</h2>
        <div className="mt-2 flex gap-4 text-sm">
          <span className="flex items-center gap-1">
            <span className="size-3 rounded-sm" style={{ background: "var(--viz-mastered)" }} /> Đã thuộc (mọi thẻ ổn định &gt;{" "}
            {MASTERED_DAYS} ngày)
          </span>
          <span className="flex items-center gap-1">
            <span className="size-3 rounded-sm" style={{ background: "var(--viz-learned)" }} /> Đang học
          </span>
        </div>
        <ul className="mt-3 space-y-3">
          {vocab.map((v) => (
            <li key={v.id}>
              <div className="flex justify-between text-sm">
                <Link href={`/learn/${v.id}`} className="hover:underline">
                  {v.name}
                </Link>
                <span className="tabular-nums">
                  {v.mastered} thuộc · {v.learned} đã học / {v.total} từ
                </span>
              </div>
              <div
                role="img"
                aria-label={`${v.name}: ${v.mastered} từ đã thuộc, ${v.learned - v.mastered} từ đang học, ${v.total - v.learned} từ chưa học`}
                className="mt-1 flex h-2 gap-[2px] rounded-full bg-muted"
              >
                {v.mastered > 0 && (
                  <span className="rounded-full" style={{ width: pct(v.mastered, v.total), background: "var(--viz-mastered)" }} />
                )}
                {v.learned > v.mastered && (
                  <span
                    className="rounded-full"
                    style={{ width: pct(v.learned - v.mastered, v.total), background: "var(--viz-learned)" }}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Từ hay quên</h2>
        {leeches.length === 0 ? (
          <p className="mt-1 opacity-75">Chưa có từ nào bị quên khi ôn tập.</p>
        ) : (
          <table className="mt-2 w-full text-left">
            <thead className="text-sm opacity-75">
              <tr className="border-b border-border">
                <th className="py-1 pr-3 font-normal">Từ</th>
                <th className="py-1 pr-3 font-normal">Nghĩa</th>
                <th className="py-1 pr-3 text-right font-normal">Số lần quên</th>
                <th className="py-1" />
              </tr>
            </thead>
            <tbody>
              {leeches.map((w) => (
                <tr key={w.id} className="border-b border-border">
                  <td className="py-1 pr-3">
                    <span lang="zh-CN" className="text-lg">
                      {w.hanzi}
                    </span>{" "}
                    <span className="text-sm opacity-75">{w.pinyin}</span>
                  </td>
                  <td className="py-1 pr-3 text-sm">{w.meaningVi}</td>
                  <td className="py-1 pr-3 text-right tabular-nums">{w.lapses}</td>
                  <td className="py-1 text-right">
                    <RelearnButton wordId={w.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Ngày học</h2>
        <p className="text-sm opacity-75">
          Chuỗi hiện tại: <strong>{streakDays} ngày</strong>. Mỗi ô là một ngày trong 26 tuần gần nhất.
        </p>
        <div className="mt-3">
          <ActivityHeatmap weeks={grid} />
        </div>
        <details className="mt-1 text-sm">
          <summary className="cursor-pointer opacity-75">Xem dạng bảng</summary>
          <table className="mt-2 tabular-nums">
            <tbody>
              {grid
                .flat()
                .filter((c) => c.count)
                .reverse()
                .map((c) => (
                  <tr key={c.date}>
                    <td className="pr-4">{c.date}</td>
                    <td className="text-right">{c.count} hoạt động</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Sao lưu tiến độ</h2>
        <p className="mb-3 max-w-2xl text-sm opacity-75">
          File backup chứa bài đã học, thẻ ôn tập, lịch sử làm bài và thi thử (không chứa nội dung bài học — phần đó seed lại
          từ thư mục data). Khôi phục sẽ ghi đè toàn bộ tiến độ hiện tại.
        </p>
        <BackupPanel />
      </section>
    </main>
  );
}
