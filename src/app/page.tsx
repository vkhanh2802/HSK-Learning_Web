import Link from "next/link";
import { prisma } from "@/lib/db";
import { SKILL_NAMES, accuracyBySkill } from "@/lib/stats";
import { getT } from "@/lib/lang-server";
import { streak } from "@/lib/streak";

const SKILL_HREF: Record<string, string> = {
  listening: "/listening",
  speaking: "/speaking",
  reading: "/reading",
  writing: "/writing",
  grammar: "/grammar",
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const t = await getT();
  const now = new Date();
  const since = new Date(now.getTime() - 400 * 24 * 3600_000);

  const [due, levels, learnedCards, attempts, lessonsDone, nextLesson] = await Promise.all([
    prisma.reviewCard.count({ where: { due: { lte: now }, suspended: false } }),
    prisma.level.findMany({ orderBy: { id: "asc" }, include: { _count: { select: { words: true } } } }),
    prisma.reviewCard.findMany({ where: { itemType: "word" }, distinct: ["itemId"], select: { itemId: true } }),
    prisma.attempt.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, skill: true, correct: true } }),
    prisma.lesson.findMany({ where: { doneAt: { gte: since } }, select: { doneAt: true } }),
    prisma.lesson.findFirst({ where: { doneAt: null }, orderBy: [{ levelId: "asc" }, { order: "asc" }] }),
  ]);

  // Đếm ở JS thay vì `id in [...]`: số từ đã học có thể vượt giới hạn 999 tham số của SQLite.
  const learned = new Set(learnedCards.map((c) => c.itemId));
  const learnedByLevel = new Map<number, number>();
  for (const w of await prisma.word.findMany({ select: { id: true, levelId: true } }))
    if (learned.has(w.id)) learnedByLevel.set(w.levelId, (learnedByLevel.get(w.levelId) ?? 0) + 1);
  const month = new Date(now.getTime() - 30 * 86_400_000);
  const skills = accuracyBySkill(attempts.filter((a) => a.createdAt >= month));
  const weak = skills.rows.find((r) => r.skill === skills.weakest);
  const days = streak([...attempts.map((a) => a.createdAt), ...lessonsDone.flatMap((l) => l.doneAt ?? [])], now);

  return (
    <main className="bare px-4 pb-16 sm:px-6">
      <section className="motion-stagger mx-auto flex min-h-[calc(100svh-7rem)] max-w-5xl flex-col justify-end gap-8 pb-10 text-white">
        <h1
          className="motion-enter text-[clamp(2.6rem,7.5vw,6.25rem)] leading-[0.98] [text-shadow:0_2px_30px_rgb(0_0_0/0.35)]"
          style={{ fontFamily: "var(--font-sans)", fontWeight: 600, letterSpacing: "-0.035em" }}
        >
          {t("Mỗi ngày một chút,", "A little every day,")}
          <br />
          {t("tiếng Trung tiến bộ.", "your Chinese grows.")}
        </h1>
        <div className="motion-enter flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-sm text-sm leading-relaxed text-white/85">
            {t(
              "Từ vựng, ngữ pháp và đủ 4 kỹ năng Nghe, Nói, Đọc, Viết từ HSK1 đến HSK4, ôn theo lịch lặp lại ngắt quãng.",
              "Vocabulary, grammar and all four skills — listening, speaking, reading, writing — from HSK1 to HSK4, reviewed with spaced repetition.",
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            {nextLesson && (
              <Link href={`/lesson/${nextLesson.id}`} className="motion-cta rounded-full bg-white px-6 py-3 font-semibold text-black">
                {t("Học bài tiếp theo", "Start next lesson")}
                <svg aria-hidden="true" className="motion-cta-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 10h12m-5-5 5 5-5 5" />
                </svg>
              </Link>
            )}
            {due > 0 && (
              <Link href="/review" className="motion-cta rounded-full border border-white/50 px-6 py-3 font-semibold text-white backdrop-blur-sm">
                {t(`Ôn ${due} thẻ đến hạn`, `Review ${due} due cards`)}
                <svg aria-hidden="true" className="motion-cta-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 10h12m-5-5 5 5-5 5" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="glass mx-auto mt-6 max-w-5xl p-5 sm:p-8">
      <div className="motion-stagger grid max-w-4xl gap-4 sm:grid-cols-3">
        <div className="motion-enter ui-card rounded-2xl border border-border bg-muted/85 p-5">
          <p className="text-sm opacity-75">{t("Thẻ đến hạn", "Cards due")}</p>
          <p className="mt-1 font-serif text-4xl tabular-nums">{due}</p>
          {due > 0 && (
            <Link href="/review" className="mt-2 inline-block text-sm font-medium underline decoration-brush decoration-2 underline-offset-4">
              {t("Ôn tập ngay", "Review now")}
            </Link>
          )}
        </div>
        <div className="motion-enter ui-card rounded-2xl border border-border bg-muted/85 p-5">
          <p className="text-sm opacity-75">{t("Chuỗi ngày học", "Study streak")}</p>
          <p className="mt-1 font-serif text-4xl tabular-nums">
            {days} <span className="text-2xl">{t("ngày", days === 1 ? "day" : "days")}</span>
          </p>
        </div>
        <div className="motion-enter ui-card rounded-2xl border border-border bg-muted/85 p-5">
          <p className="text-sm opacity-75">{t("Bài tiếp theo", "Next lesson")}</p>
          {nextLesson ? (
            <Link href={`/lesson/${nextLesson.id}`} className="mt-1.5 block font-semibold underline decoration-brush decoration-2 underline-offset-4">
              HSK{nextLesson.levelId} · {t("Bài", "Lesson")} {nextLesson.order}: {nextLesson.title}
            </Link>
          ) : (
            <p className="mt-1.5">{t("Đã học hết các bài hiện có 🎉", "All current lessons done 🎉")}</p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl">
      <p className="mt-5 text-sm sm:text-base">
        {weak ? (
          <>
            {t("Kỹ năng yếu nhất 30 ngày qua:", "Weakest skill in the last 30 days:")} <strong>{SKILL_NAMES[weak.skill]}</strong> ({Math.round(weak.rate! * 100)}{t("% đúng", "% correct")}) —{" "}
            <Link href={SKILL_HREF[weak.skill]} className="underline decoration-brush decoration-2 underline-offset-4">
              {t("luyện ngay", "practise now")}
            </Link>
            .{" "}
          </>
        ) : (
          t("Làm thêm bài luyện để biết kỹ năng nào còn yếu. ", "Do more exercises to see which skill is weakest. ")
        )}
        <Link href="/stats" className="underline decoration-brush decoration-2 underline-offset-4">
          {t("Xem thống kê", "View stats")}
        </Link>
      </p>

      <h2 className="mt-8 text-2xl">{t("Luyện nhanh", "Quick practice")}</h2>
      <div className="motion-stagger mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { href: "/listening", vi: "Nghe", en: "Listening", zh: "听" },
          { href: "/speaking", vi: "Nói", en: "Speaking", zh: "说" },
          { href: "/reading", vi: "Đọc", en: "Reading", zh: "读" },
          { href: "/writing", vi: "Viết", en: "Writing", zh: "写" },
          { href: "/grammar", vi: "Ngữ pháp", en: "Grammar", zh: "法" },
          { href: "/pinyin", vi: "Pinyin", en: "Pinyin", zh: "拼" },
        ].map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="motion-enter flex items-center gap-2.5 rounded border border-border bg-muted/65 px-3.5 py-2.5 hover:bg-muted"
          >
            <span lang="zh-CN" className="flex size-8 items-center justify-center rounded-lg bg-background/80 font-serif text-lg text-brush shadow-xs">
              {q.zh}
            </span>
            <span className="text-sm font-medium">{t(q.vi, q.en)}</span>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 text-2xl">{t("Tiến độ từ vựng", "Vocabulary progress")}</h2>
      <ul className="motion-stagger mt-3 grid gap-3 sm:grid-cols-2">
        {levels.map((l) => {
          const learned = learnedByLevel.get(l.id) ?? 0;
          const total = l._count.words;
          const pct = total ? Math.round((learned / total) * 100) : 0;
          return (
            <li key={l.id} className="motion-enter">
              <Link href={`/learn/${l.id}`} className="block rounded border border-border bg-muted/55 p-3.5 hover:bg-muted">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold">{l.name}</span>
                  <span className="tabular-nums opacity-80">
                    {learned}/{total} {t("từ", "words")} · {pct}%
                  </span>
                </div>
                <div
                  role="progressbar"
                  className="mt-2 h-2 w-full overflow-hidden rounded-full bg-background/80"
                  aria-valuenow={learned}
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-label={t(`${l.name}: đã học ${learned} trên ${total} từ`, `${l.name}: ${learned} of ${total} words learned`)}
                >
                  <div className="bar h-full rounded-full bg-accent" style={{ width: `${total ? (learned / total) * 100 : 0}%` }} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      </div>
      </div>
    </main>
  );
}
