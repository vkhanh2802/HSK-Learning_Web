import Link from "next/link";
import { ActivityHeatmap, ForecastChart } from "@/components/Charts";
import { BackupPanel, RelearnButton } from "@/components/StatsActions";
import { prisma } from "@/lib/db";
import { meaning, tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { streak } from "@/lib/streak";
import { MASTERED_DAYS, SKILL_NAMES, SKILL_NAMES_EN, accuracyBySkill, forecast, heatmap, isMastered } from "@/lib/stats";

export const dynamic = "force-dynamic";

type Fsrs = { stability: number; lapses: number };

export default async function Page() {
  const lang = await getLang();
  const t = tr(lang);
  const skillName = (s: string) => t(SKILL_NAMES[s], SKILL_NAMES_EN[s]);
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 86_400_000);
  const since26w = new Date(now.getTime() - 26 * 7 * 86_400_000);

  const [cards, recent, activity, lessonsDone, levels, words] = await Promise.all([
    prisma.reviewCard.findMany({ where: { itemType: "word" }, select: { itemId: true, fsrs: true, due: true, suspended: true } }),
    prisma.attempt.findMany({ where: { createdAt: { gte: since30 } }, select: { skill: true, correct: true } }),
    prisma.attempt.findMany({ where: { createdAt: { gte: since26w } }, select: { createdAt: true } }),
    prisma.lesson.findMany({ where: { doneAt: { not: null } }, select: { doneAt: true } }),
    prisma.level.findMany({ orderBy: { id: "asc" }, select: { id: true, name: true } }),
    prisma.word.findMany({ select: { id: true, hanzi: true, pinyin: true, meaningVi: true, meaningEn: true, levelId: true } }),
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
      <h1 className="text-2xl font-bold">{t("Thống kê", "Stats")}</h1>

      <section className="mt-6">
        <h2 className="text-2xl">{t("Thẻ ôn 30 ngày tới", "Cards due in the next 30 days")}</h2>
        <p className="text-sm opacity-75">{t("Số thẻ đến hạn mỗi ngày — biết trước ngày nào ôn nhiều để chia bớt bài mới.", "Cards due each day — know in advance which days are heavy so you can pace new lessons.")}</p>
        <div className="mt-3">
          <ForecastChart data={days} />
        </div>
        <details className="mt-1 text-sm">
          <summary className="cursor-pointer opacity-75">{t("Xem dạng bảng", "View as table")}</summary>
          <table className="mt-2 tabular-nums">
            <tbody>
              {days
                .filter((d) => d.count)
                .map((d) => (
                  <tr key={d.date}>
                    <td className="pr-4">{d.date}</td>
                    <td className="text-right">{d.count} {t("thẻ", "cards")}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl">{t("Độ chính xác theo kỹ năng (30 ngày)", "Accuracy by skill (30 days)")}</h2>
        <p className="text-sm opacity-75">
          {t("Tính từ mọi lượt làm bài: ôn thẻ, luyện nghe/nói/đọc/viết, ngữ pháp, thi thử.", "Based on every attempt: card reviews, listening/speaking/reading/writing practice, grammar, mock tests.")}
          {weakest && (
            <>
              {" "}
              {t("Yếu nhất:", "Weakest:")} <strong>{skillName(weakest)}</strong>.
            </>
          )}
        </p>
        <ul className="mt-3 space-y-2">
          {skills.map((s) => (
            <li key={s.skill} className="grid grid-cols-[6rem_1fr_9rem] items-center gap-3">
              <span>
                {skillName(s.skill)}
                {s.skill === weakest && <span className="ml-1 text-xs opacity-75">{t("(yếu nhất)", "(weakest)")}</span>}
              </span>
              <span className="h-2 overflow-hidden rounded-full" style={{ background: "var(--viz-track)" }}>
                <span
                  className="bar block h-2 rounded-full"
                  style={{ width: s.rate === null ? 0 : `${s.rate * 100}%`, background: "var(--viz-bar)" }}
                />
              </span>
              <span className="text-sm tabular-nums">
                {s.rate === null ? t("chưa có", "no data") : `${Math.round(s.rate * 100)}% · ${s.total} ${t("lượt", "attempts")}`}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl">{t("Tiến độ từ vựng", "Vocabulary progress")}</h2>
        <div className="mt-2 flex gap-4 text-sm">
          <span className="flex items-center gap-1">
            <span className="size-3 rounded-sm" style={{ background: "var(--viz-mastered)" }} /> {t("Đã thuộc (mọi thẻ ổn định >", "Mastered (every card stable >")}{" "}
            {MASTERED_DAYS} {t("ngày)", "days)")}
          </span>
          <span className="flex items-center gap-1">
            <span className="size-3 rounded-sm" style={{ background: "var(--viz-learned)" }} /> {t("Đang học", "Learning")}
          </span>
        </div>
        <ul className="mt-3 space-y-3">
          {vocab.map((v) => (
            <li key={v.id}>
              <div className="flex justify-between text-sm">
                <Link href={`/learn/${v.id}`}>
                  {v.name}
                </Link>
                <span className="tabular-nums">
                  {v.mastered} {t("thuộc", "mastered")} · {v.learned} {t("đã học", "learned")} / {v.total} {t("từ", "words")}
                </span>
              </div>
              <div
                role="img"
                aria-label={t(`${v.name}: ${v.mastered} từ đã thuộc, ${v.learned - v.mastered} từ đang học, ${v.total - v.learned} từ chưa học`, `${v.name}: ${v.mastered} words mastered, ${v.learned - v.mastered} learning, ${v.total - v.learned} not started`)}
                className="mt-1 flex h-2 gap-[2px] rounded-full bg-muted"
              >
                {v.mastered > 0 && (
                  <span className="bar rounded-full" style={{ width: pct(v.mastered, v.total), background: "var(--viz-mastered)" }} />
                )}
                {v.learned > v.mastered && (
                  <span
                    className="bar rounded-full"
                    style={{ width: pct(v.learned - v.mastered, v.total), background: "var(--viz-learned)" }}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl">{t("Từ hay quên", "Most-forgotten words")}</h2>
        {leeches.length === 0 ? (
          <p className="mt-1 opacity-75">{t("Chưa có từ nào bị quên khi ôn tập.", "No word has been forgotten in review yet.")}</p>
        ) : (
          <table className="mt-2 w-full text-left">
            <thead className="text-sm opacity-75">
              <tr className="border-b border-border">
                <th className="py-1 pr-3 font-normal">{t("Từ", "Word")}</th>
                <th className="py-1 pr-3 font-normal">{t("Nghĩa", "Meaning")}</th>
                <th className="py-1 pr-3 text-right font-normal">{t("Số lần quên", "Lapses")}</th>
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
                  <td className="py-1 pr-3 text-sm">{meaning(lang, w)}</td>
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
        <h2 className="text-2xl">{t("Ngày học", "Study days")}</h2>
        <p className="text-sm opacity-75">
          {t("Chuỗi hiện tại:", "Current streak:")} <strong>{streakDays} {t("ngày", streakDays === 1 ? "day" : "days")}</strong>. {t("Mỗi ô là một ngày trong 26 tuần gần nhất.", "Each square is one day over the last 26 weeks.")}
        </p>
        <div className="mt-3">
          <ActivityHeatmap weeks={grid} />
        </div>
        <details className="mt-1 text-sm">
          <summary className="cursor-pointer opacity-75">{t("Xem dạng bảng", "View as table")}</summary>
          <table className="mt-2 tabular-nums">
            <tbody>
              {grid
                .flat()
                .filter((c) => c.count)
                .reverse()
                .map((c) => (
                  <tr key={c.date}>
                    <td className="pr-4">{c.date}</td>
                    <td className="text-right">{c.count} {t("hoạt động", "activities")}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl">{t("Sao lưu tiến độ", "Back up your progress")}</h2>
        <p className="mb-3 max-w-2xl text-sm opacity-75">
          {t(
            "File backup chứa bài đã học, thẻ ôn tập, lịch sử làm bài và thi thử (không chứa nội dung bài học — phần đó seed lại từ thư mục data). Khôi phục sẽ ghi đè toàn bộ tiến độ hiện tại.",
            "The backup file holds completed lessons, review cards, attempt history and mock tests (not lesson content — that is re-seeded from the data folder). Restoring overwrites all current progress.",
          )}
        </p>
        <BackupPanel />
      </section>
    </main>
  );
}
