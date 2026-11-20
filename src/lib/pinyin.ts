// Âm tiết bắt đầu bằng a/o/e (sau âm tiết đầu) cần dấu ' để không đọc nhầm: nǚ ér -> nǚ'ér.
const VOWEL_START = /^[aāáǎàoōóǒòeēéěè]/i;

/** Ghép pinyin tách âm tiết ("bà ba") thành dạng viết liền ("bàba"). */
export function joinSyllables(syllables: string[]): string {
  return syllables.map((s, i) => (i > 0 && VOWEL_START.test(s) ? `'${s}` : s)).join("");
}
