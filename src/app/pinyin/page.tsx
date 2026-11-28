import Link from "next/link";
import PinyinGrid from "@/components/PinyinGrid";
import { getT } from "@/lib/lang-server";
import { getSyllables } from "@/lib/syllables";

const INITIALS = ["b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "zh", "ch", "sh", "r", "z", "c", "s", "y", "w", ""];

const TIPS = [
  {
    title: ["zh / ch / sh / r — uốn lưỡi", "zh / ch / sh / r — retroflex"],
    body: [
      "Cong đầu lưỡi lên chạm vòm miệng. zh gần “tr” tiếng Việt, ch là “tr” bật hơi, sh gần “s” uốn lưỡi, r gần “r” nhẹ (giữa “r” và “d”).",
      "Curl the tip of the tongue up toward the roof of the mouth. zh is like a hard “j”, ch is like “ch” in “church” with a puff of air, sh is like “sh” with the tongue curled back, r is a soft “r” (between “r” and “zh”).",
    ],
  },
  {
    title: ["z / c / s — đầu lưỡi phẳng", "z / c / s — flat tongue tip"],
    body: [
      "Đầu lưỡi đặt sau răng cửa dưới. z gần “ch” nhẹ không bật hơi, c như “ts” bật hơi mạnh, s như “x” tiếng Việt. Đừng đọc c thành “c/k”.",
      "Rest the tongue tip behind the lower front teeth. z is like “ds” in “kids” with no puff of air, c is like “ts” in “cats” with a strong puff, s is like English “s”.",
    ],
  },
  {
    title: ["j / q / x — mặt lưỡi", "j / q / x — tongue blade"],
    body: [
      "Chỉ đi với i, ü. j gần “ch” nhẹ, q là “ch” bật hơi, x gần “x” nhưng mặt lưỡi nâng cao. Sau j/q/x, chữ u thật ra là ü (ju = jü).",
      "Only used with i and ü. j is like a soft “j”, q is “ch” with a puff of air, x is like “sh” but with the blade of the tongue raised high. After j/q/x, the letter u is really ü (ju = jü).",
    ],
  },
  {
    title: ["Nguyên âm ü", "The vowel ü"],
    body: [
      "Môi tròn như đọc “u” nhưng lưỡi đặt như đọc “i”. Tiếng Việt không có âm này — giữ môi tròn, nói “i”.",
      "Round the lips as if saying “oo”, but place the tongue as if saying “ee”. Keep the lips rounded and say “ee”.",
    ],
  },
  {
    title: ["-n và -ng", "-n and -ng"],
    body: [
      "-n kết thúc bằng đầu lưỡi chạm lợi trên (an, en, in), -ng mở họng phía sau (ang, eng, ing). Người Việt hay đọc lẫn eng/en và ing/in.",
      "-n ends with the tongue tip touching the gum ridge (an, en, in); -ng opens at the back of the throat (ang, eng, ing). Learners often mix up eng/en and ing/in.",
    ],
  },
  {
    title: ["Bật hơi: b/p, d/t, g/k", "Aspiration: b/p, d/t, g/k"],
    body: [
      "Cặp sau bật hơi mạnh (để tờ giấy trước miệng thấy rung). b, d, g không bật hơi và gần như “p, t, k” không có hơi — không đọc thành “b, đ, g” tiếng Việt.",
      "The second of each pair has a strong puff of air (hold a sheet of paper before your mouth and it will flutter). b, d, g are unaspirated, close to “p, t, k” with no breath — do not pronounce them like voiced English “b, d, g”.",
    ],
  },
  {
    title: ["e và i đặc biệt", "Special e and i"],
    body: [
      "e đứng một mình đọc gần “ơ” (hē, gè), không phải “e”. i sau z/c/s/zh/ch/sh/r không đọc “i” mà là âm kéo dài của phụ âm (shì, zì).",
      "A lone e sounds like the “uh” in “duh” (hē, gè), not English “e”. After z/c/s/zh/ch/sh/r, i is not “ee” but a prolonged consonant sound (shì, zì).",
    ],
  },
] as const;

const TONE_INFO = [
  { mark: "ā", name: ["Thanh 1", "Tone 1"], body: ["Cao, bằng, kéo dài — gần thanh ngang nhưng cao hơn.", "High, level, sustained — like a held note."] },
  { mark: "á", name: ["Thanh 2", "Tone 2"], body: ["Đi lên từ trung lên cao — gần thanh sắc.", "Rising from mid to high — like a question “what?”."] },
  { mark: "ǎ", name: ["Thanh 3", "Tone 3"], body: ["Xuống thấp rồi lên — gần thanh hỏi; trong câu thường chỉ đọc nửa thấp.", "Falls low then rises — in a sentence usually only the low half is said."] },
  { mark: "à", name: ["Thanh 4", "Tone 4"], body: ["Rơi mạnh từ cao xuống thấp — gần thanh nặng nhưng dứt khoát hơn.", "Sharp fall from high to low — like a firm command."] },
  { mark: "a", name: ["Thanh nhẹ", "Neutral tone"], body: ["Ngắn, nhẹ, không dấu (ma, de, ne).", "Short, light, unmarked (ma, de, ne)."] },
] as const;

export default async function Page() {
  const tt = await getT();
  const syllables = getSyllables();
  const groups = INITIALS.map((initial) => ({
    initial,
    syllables: syllables.filter((s) => s.initial === initial),
  })).filter((g) => g.syllables.length > 0);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{tt("Bảng pinyin", "Pinyin chart")}</h1>
      <p className="mt-1 text-sm opacity-75">
        {tt(
          "Mỗi âm được đọc bằng một chữ Hán có đúng âm đó (lấy từ từ vựng HSK1–4), nên một số thanh còn trống. Luyện nghe thanh ở trang",
          "Each sound is read using a character with exactly that sound (taken from HSK1–4 vocabulary), so some tones are empty. Practise hearing tones on the",
        )}{" "}
        <Link href="/tones" className="underline decoration-brush decoration-2 underline-offset-4">
          {tt("Thanh điệu", "Tones")}
        </Link>
        {tt(".", " page.")}
      </p>

      <h2 className="mt-6 text-lg font-semibold">{tt("4 thanh và thanh nhẹ", "The 4 tones and the neutral tone")}</h2>
      <ul className="motion-stagger mt-2 grid gap-2 sm:grid-cols-5">
        {TONE_INFO.map((t) => (
          <li key={t.name[0]} className="motion-enter ui-card rounded border border-border bg-muted/35 p-3">
            <span className="text-2xl">{t.mark}</span> <span className="font-semibold">{tt(t.name[0], t.name[1])}</span>
            <p className="text-sm">{tt(t.body[0], t.body[1])}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-6 text-lg font-semibold">{tt("Điểm khó cho người Việt", "Tricky points")}</h2>
      <ul className="motion-stagger mt-2 grid gap-2 sm:grid-cols-2">
        {TIPS.map((t) => (
          <li key={t.title[0]} className="motion-enter ui-card rounded border border-border bg-muted/35 p-3">
            <p className="font-semibold">{tt(t.title[0], t.title[1])}</p>
            <p className="text-sm">{tt(t.body[0], t.body[1])}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-6 text-lg font-semibold">{tt("Bảng âm tiết", "Syllable chart")} ({syllables.length} {tt("âm", "sounds")})</h2>
      <PinyinGrid groups={groups} />
    </main>
  );
}
