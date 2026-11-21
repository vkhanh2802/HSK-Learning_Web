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

const DIGITS = "零一二三四五六七八九";

/** 0–99 sang chữ Hán (8 -> 八, 10 -> 十, 12 -> 十二, 20 -> 二十). Ngoài khoảng đó đọc từng chữ số. */
export function toChineseNumber(n: number): string {
  if (n < 10) return DIGITS[n];
  if (n < 100) return `${n >= 20 ? DIGITS[Math.floor(n / 10)] : ""}十${n % 10 ? DIGITS[n % 10] : ""}`;
  return [...String(n)].map((d) => DIGITS[Number(d)]).join("");
}

// Nhận diện giọng nói hay trả số bằng chữ số (8点); đổi về chữ Hán để so với câu gốc.
const speechChars = (s: string) => [...s.replace(/\d+/g, (d) => toChineseNumber(Number(d))).replace(/[\s\p{P}]/gu, "")];

/**
 * So câu nói (văn bản nhận diện được) với câu gốc theo từng chữ, dùng dãy con chung dài nhất.
 * Hai chữ được tính là khớp nếu giống hệt hoặc cùng âm khi bỏ thanh (nhận diện hay ra chữ đồng âm: 他/她).
 * `sounds`: chữ -> các âm không thanh, vd. { 他: ["ta"] }.
 * Trả về từng chữ của câu gốc (dấu câu luôn ok) và điểm = số chữ khớp / số chữ (không tính dấu câu).
 */
export function alignSpeech(expected: string, heard: string, sounds: Record<string, string[]>) {
  const exp = [...expected];
  const want = exp.map((c, i) => ({ c, i })).filter(({ c }) => !/[\s\p{P}]/u.test(c));
  const got = speechChars(heard);
  const same = (a: string, b: string) => a === b || (sounds[a] ?? []).some((s) => (sounds[b] ?? []).includes(s));

  // Bảng LCS rồi lần ngược để biết chữ nào của câu gốc được khớp.
  const L = Array.from({ length: want.length + 1 }, () => new Array<number>(got.length + 1).fill(0));
  for (let i = want.length - 1; i >= 0; i--)
    for (let j = got.length - 1; j >= 0; j--)
      L[i][j] = same(want[i].c, got[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const matched = new Set<number>();
  for (let i = 0, j = 0; i < want.length && j < got.length; ) {
    if (same(want[i].c, got[j])) {
      matched.add(want[i].i);
      i++;
      j++;
    } else if (L[i + 1][j] >= L[i][j + 1]) i++;
    else j++;
  }

  return {
    chars: exp.map((c, i) => ({ c, ok: matched.has(i) || /[\s\p{P}]/u.test(c) })),
    score: want.length ? matched.size / want.length : 0,
  };
}
