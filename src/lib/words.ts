import { prisma } from "@/lib/db";
import { meaning } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

export type Example = { hanzi: string; pinyin: string; vi: string };
export type WordView = {
  id: number;
  hanzi: string;
  pinyin: string;
  /** Nghĩa theo ngôn ngữ đang chọn (Anh/Việt). */
  meaning: string;
  pos: string | null;
  example: Example | null;
  chars: { char: string; pinyin: string }[];
};

/** Lấy từ kèm chữ tách sẵn, giữ đúng thứ tự `ids`. */
export async function getWords(ids: number[]): Promise<WordView[]> {
  // SQLite giới hạn số tham số mỗi truy vấn (999) nên chia danh sách id thành từng phần.
  const lang = await getLang();
  const chunks = Array.from({ length: Math.ceil(ids.length / 500) }, (_, i) => ids.slice(i * 500, i * 500 + 500));
  const rows = (
    await Promise.all(
      chunks.map((chunk) =>
        prisma.word.findMany({
          where: { id: { in: chunk } },
          include: { characters: { include: { character: true }, orderBy: { position: "asc" } } },
        }),
      ),
    )
  ).flat();
  const byId = new Map(
    rows.map((w) => [
      w.id,
      {
        id: w.id,
        hanzi: w.hanzi,
        pinyin: w.pinyin,
        meaning: meaning(lang, w),
        pos: w.pos,
        example: (JSON.parse(w.examples) as Example[])[0] ?? null,
        chars: w.characters.map((c) => ({ char: c.character.char, pinyin: c.character.pinyin })),
      },
    ]),
  );
  return ids.flatMap((id) => byId.get(id) ?? []);
}
