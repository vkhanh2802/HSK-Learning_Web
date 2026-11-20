import { prisma } from "@/lib/db";

export type Example = { hanzi: string; pinyin: string; vi: string };
export type WordView = {
  id: number;
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  pos: string | null;
  example: Example | null;
  chars: { char: string; pinyin: string }[];
};

/** Lấy từ kèm chữ tách sẵn, giữ đúng thứ tự `ids`. */
export async function getWords(ids: number[]): Promise<WordView[]> {
  const rows = await prisma.word.findMany({
    where: { id: { in: ids } },
    include: { characters: { include: { character: true }, orderBy: { position: "asc" } } },
  });
  const byId = new Map(
    rows.map((w) => [
      w.id,
      {
        id: w.id,
        hanzi: w.hanzi,
        pinyin: w.pinyin,
        meaningVi: w.meaningVi,
        pos: w.pos,
        example: (JSON.parse(w.examples) as Example[])[0] ?? null,
        chars: w.characters.map((c) => ({ char: c.character.char, pinyin: c.character.pinyin })),
      },
    ]),
  );
  return ids.flatMap((id) => byId.get(id) ?? []);
}
