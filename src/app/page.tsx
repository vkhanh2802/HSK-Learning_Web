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
    <main className="px-6 pb-16 pt-10">
      <section className="motion-stagger mx-auto max-w-2xl text-center">
        <h1 className="motion-enter text-4xl leading-tight sm:text-5xl">
          {t("Mỗi ngày một chút,", "A little every day,")}
          <br />
          <span className="relative inline-block">
            {t("tiếng Trung tiến bộ.", "your Chinese grows.")}
            <svg aria-hidden className="absolute -bottom-3 left-0 w-full text-brush" viewBox="0 0 300 14" preserveAspectRatio="none">
              <path className="motion-brush" pathLength="1" d="M3 9 C60 3, 130 12, 190 6 S270 4, 297 8" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </span>
        </h1>
        <p className="motion-enter mx-auto mt-10 max-w-md opacity-80">
          {t(
            "Từ vựng, ngữ pháp và đủ 4 kỹ năng Nghe, Nói, Đọc, Viết từ HSK1 đến HSK4, ôn theo lịch lặp lại ngắt quãng.",
            "Vocabulary, grammar and all four skills — listening, speaking, reading, writing — from HSK1 to HSK4, reviewed with spaced repetition.",
          )}
        </p>
        <div className="motion-enter mt-6 flex flex-wrap justify-center gap-3">
          {nextLesson && (
            <Link href={`/lesson/${nextLesson.id}`} className="motion-cta rounded-xl bg-accent px-6 py-3 font-semibold text-background">
              {t("Học bài tiếp theo", "Start next lesson")}
              <svg aria-hidden="true" className="motion-cta-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 10h12m-5-5 5 5-5 5" />
              </svg>
            </Link>
          )}
          {due > 0 && (
            <Link href="/review" className="motion-cta rounded-xl border border-border px-6 py-3 font-semibold">
              {t(`Ôn ${due} thẻ đến hạn`, `Review ${due} due cards`)}
              <svg aria-hidden="true" className="motion-cta-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 10h12m-5-5 5 5-5 5" />
              </svg>
            </Link>
          )}
        </div>
      </section>

      <div aria-hidden className="mx-auto mt-12 flex max-w-md justify-center" lang="zh-CN">
        {[
          { h: "你好", p: "nǐ hǎo", m: t("Xin chào", "Hello"), tilt: "-7deg" },
          { h: "谢谢", p: "xièxie", m: t("Cảm ơn", "Thank you"), tilt: "1deg" },
          { h: "学习", p: "xuéxí", m: t("Học tập", "To study"), tilt: "8deg" },
        ].map((c, i) => (
          <div
            key={c.h}
            className="flashcard -mx-1 w-36 rounded-2xl border border-border bg-background px-4 py-6 text-center shadow-sm"
            style={{ "--tilt": c.tilt, "--i": i } as React.CSSProperties}
          >
            <p className="font-serif text-5xl">{c.h}</p>
            <p className="mt-2 text-sm opacity-70" lang="vi">{c.p}</p>
            <p className="mt-1 text-sm font-semibold" lang={t("vi", "en")}>{c.m}</p>
          </div>
        ))}
      </div>

      <div className="motion-stagger mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
        <div className="motion-enter rounded-2xl border border-border bg-muted p-5">
          <p className="text-sm opacity-75">{t("Thẻ đến hạn", "Cards due")}</p>
          <p className="font-serif text-4xl">{due}</p>
          {due > 0 && (
            <Link href="/review" className="underline decoration-brush decoration-2 underline-offset-4">
              {t("Ôn tập ngay", "Review now")}
            </Link>
          )}
        </div>
        <div className="motion-enter rounded-2xl border border-border bg-muted p-5">
          <p className="text-sm opacity-75">{t("Chuỗi ngày học", "Study streak")}</p>
          <p className="font-serif text-4xl">{days} {t("ngày", days === 1 ? "day" : "days")}</p>
        </div>
        <div className="motion-enter rounded-2xl border border-border bg-muted p-5">
          <p className="text-sm opacity-75">{t("Bài tiếp theo", "Next lesson")}</p>
          {nextLesson ? (
            <Link href={`/lesson/${nextLesson.id}`} className="mt-1 block font-semibold underline decoration-brush decoration-2 underline-offset-4">
              HSK{nextLesson.levelId} · {t("Bài", "Lesson")} {nextLesson.order}: {nextLesson.title}
            </Link>
          ) : (
            <p className="mt-1">{t("Đã học hết các bài hiện có 🎉", "All current lessons done 🎉")}</p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl">
      <p className="mt-4">
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

      <h2 className="mt-10 text-2xl">{t("Tiến độ từ vựng", "Vocabulary progress")}</h2>
      <ul className="motion-stagger mt-3 grid gap-3">
        {levels.map((l) => {
          const learned = learnedByLevel.get(l.id) ?? 0;
          const total = l._count.words;
          return (
            <li key={l.id} className="motion-enter">
              <div className="flex justify-between text-sm">
                <Link href={`/learn/${l.id}`} className="hover:underline">
                  {l.name}
                </Link>
                <span>
                  {learned}/{total} {t("từ", "words")}
                </span>
              </div>
              <div
                role="progressbar"
                className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted"
                aria-valuenow={learned}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-label={t(`${l.name}: đã học ${learned} trên ${total} từ`, `${l.name}: ${learned} of ${total} words learned`)}
              >
                <div className="bar h-full rounded-full bg-accent" style={{ width: `${total ? (learned / total) * 100 : 0}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      </div>
    </main>
  );
}
