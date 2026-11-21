import SpeakingPractice, { type SpeakLesson } from "@/components/SpeakingPractice";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/lang-server";
import { charSounds } from "@/lib/syllables";
import { getWords } from "@/lib/words";

export const dynamic = "force-dynamic";

export default async function Page() {
  const t = await getT();
  const rows = await prisma.lesson.findMany({
    orderBy: [{ levelId: "asc" }, { order: "asc" }],
    include: { items: { where: { itemType: "word" }, orderBy: { order: "asc" } } },
  });
  const words = new Map((await getWords(rows.flatMap((l) => l.items.map((i) => i.itemId)))).map((w) => [w.id, w]));
  const lessons: SpeakLesson[] = rows.map((l) => {
    const ws = l.items.flatMap((i) => words.get(i.itemId) ?? []);
    return {
      id: l.id,
      title: `HSK${l.levelId} · ${t("Bài", "Lesson")} ${l.order}: ${l.title}`,
      words: ws.map((w) => ({ hanzi: w.hanzi, pinyin: w.pinyin, vi: w.meaning })),
      sentences: ws.flatMap((w) => (w.example ? [w.example] : [])),
    };
  });

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{t("Luyện nói", "Speaking practice")}</h1>
      <p className="mt-1 max-w-2xl text-sm opacity-75">
        {t(
          "Nghe mẫu, bấm 🎙 rồi nói theo. Máy nhận diện giọng nói của trình duyệt (Chrome/Edge, cần mạng) sẽ tô đỏ chữ chưa nghe ra. Máy chấm theo chữ nhận được, chưa chấm được thanh điệu — hãy nghe lại bản ghi để tự so với mẫu.",
          "Listen to the model, press 🎙 and repeat. The browser's speech recognition (Chrome/Edge, needs internet) highlights in red the words it did not hear. It scores the recognised characters only, not tones — replay your recording to compare it with the model yourself.",
        )}
      </p>
      <SpeakingPractice lessons={lessons} sounds={charSounds()} />
    </main>
  );
}
