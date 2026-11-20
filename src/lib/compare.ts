import { stripTone } from "@/lib/pinyin";

// Bỏ dấu câu (Latin + Trung), khoảng trắng và dấu ' của pinyin; chữ thường.
const clean = (s: string) =>
  s
    .normalize("NFC")
    .toLowerCase()
    .replace(/[\s'’\p{P}]/gu, "");

/**
 * Chấm chép chính tả: đúng nếu khớp chữ Hán, hoặc khớp pinyin (có dấu thanh hay không dấu đều được),
 * không tính dấu câu, khoảng trắng, hoa thường. Pinyin gõ "v" thay "ü" cũng được.
 */
export function matchesDictation(input: string, expected: { hanzi: string; pinyin: string }): boolean {
  const got = clean(input).replace(/v/g, "ü");
  if (!got) return false;
  if (got === clean(expected.hanzi)) return true;
  const pinyin = clean(expected.pinyin);
  return got === pinyin || stripTone(got) === stripTone(pinyin);
}
