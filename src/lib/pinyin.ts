// Âm tiết bắt đầu bằng a/o/e (sau âm tiết đầu) cần dấu ' để không đọc nhầm: nǚ ér -> nǚ'ér.
const VOWEL_START = /^[aāáǎàoōóǒòeēéěè]/i;

/** Ghép pinyin tách âm tiết ("bà ba") thành dạng viết liền ("bàba"). */
export function joinSyllables(syllables: string[]): string {
  return syllables.map((s, i) => (i > 0 && VOWEL_START.test(s) ? `'${s}` : s)).join("");
}

export type Tone = 1 | 2 | 3 | 4 | 5; // 5 = thanh nhẹ

const MARKS: Record<string, string> = {
  a: "āáǎà",
  e: "ēéěè",
  i: "īíǐì",
  o: "ōóǒò",
  u: "ūúǔù",
  ü: "ǖǘǚǜ",
};
const UNMARK = new Map(
  Object.entries(MARKS).flatMap(([base, marked]) => [...marked].map((m, i) => [m, { base, tone: (i + 1) as Tone }])),
);

/** "ma3" -> "mǎ", "lv4"/"lü4" -> "lǜ", "ma5"/"ma" -> "ma". Một âm tiết. */
export function numericToMarked(numeric: string): string {
  const m = /^([a-zü:]+?)([1-5])?$/i.exec(numeric.trim().replace(/u:|v/gi, "ü"));
  if (!m) return numeric;
  const [, syl, t] = m;
  const tone = Number(t ?? 5);
  if (tone === 5) return syl;
  // Quy tắc đặt dấu: a/e luôn mang dấu; "ou" dấu trên o; còn lại đặt trên nguyên âm cuối.
  const lower = syl.toLowerCase();
  let idx = lower.search(/[ae]/);
  if (idx < 0) idx = lower.indexOf("ou");
  if (idx < 0) idx = Math.max(...[..."iouü"].map((v) => lower.lastIndexOf(v)));
  if (idx < 0) return syl;
  const marked = MARKS[lower[idx]][tone - 1];
  const out = syl[idx] === lower[idx] ? marked : marked.toUpperCase();
  return syl.slice(0, idx) + out + syl.slice(idx + 1);
}

/** Thanh điệu của một âm tiết có dấu: "mǎ" -> 3, "ma" -> 5. */
export function toneOf(syllable: string): Tone {
  for (const ch of syllable.toLowerCase()) {
    const u = UNMARK.get(ch);
    if (u) return u.tone;
  }
  return 5;
}

/** Bỏ dấu thanh: "mǎ" -> "ma", "lǜ" -> "lü". */
export function stripTone(syllable: string): string {
  return [...syllable].map((ch) => UNMARK.get(ch.toLowerCase())?.base ?? ch).join("");
}
