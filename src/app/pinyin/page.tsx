import Link from "next/link";
import PinyinGrid from "@/components/PinyinGrid";
import { getSyllables } from "@/lib/syllables";

const INITIALS = ["b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "zh", "ch", "sh", "r", "z", "c", "s", "y", "w", ""];

const TIPS = [
  {
    title: "zh / ch / sh / r — uốn lưỡi",
    body: "Cong đầu lưỡi lên chạm vòm miệng. zh gần “tr” tiếng Việt, ch là “tr” bật hơi, sh gần “s” uốn lưỡi, r gần “r” nhẹ (giữa “r” và “d”).",
  },
  {
    title: "z / c / s — đầu lưỡi phẳng",
    body: "Đầu lưỡi đặt sau răng cửa dưới. z gần “ch” nhẹ không bật hơi, c như “ts” bật hơi mạnh, s như “x” tiếng Việt. Đừng đọc c thành “c/k”.",
  },
  {
    title: "j / q / x — mặt lưỡi",
    body: "Chỉ đi với i, ü. j gần “ch” nhẹ, q là “ch” bật hơi, x gần “x” nhưng mặt lưỡi nâng cao. Sau j/q/x, chữ u thật ra là ü (ju = jü).",
  },
  {
    title: "Nguyên âm ü",
    body: "Môi tròn như đọc “u” nhưng lưỡi đặt như đọc “i”. Tiếng Việt không có âm này — giữ môi tròn, nói “i”.",
  },
  {
    title: "-n và -ng",
    body: "-n kết thúc bằng đầu lưỡi chạm lợi trên (an, en, in), -ng mở họng phía sau (ang, eng, ing). Người Việt hay đọc lẫn eng/en và ing/in.",
  },
  {
    title: "Bật hơi: b/p, d/t, g/k",
    body: "Cặp sau bật hơi mạnh (để tờ giấy trước miệng thấy rung). b, d, g không bật hơi và gần như “p, t, k” không có hơi — không đọc thành “b, đ, g” tiếng Việt.",
  },
  {
    title: "e và i đặc biệt",
    body: "e đứng một mình đọc gần “ơ” (hē, gè), không phải “e”. i sau z/c/s/zh/ch/sh/r không đọc “i” mà là âm kéo dài của phụ âm (shì, zì).",
  },
];

const TONE_INFO = [
  { mark: "ā", name: "Thanh 1", body: "Cao, bằng, kéo dài — gần thanh ngang nhưng cao hơn." },
  { mark: "á", name: "Thanh 2", body: "Đi lên từ trung lên cao — gần thanh sắc." },
  { mark: "ǎ", name: "Thanh 3", body: "Xuống thấp rồi lên — gần thanh hỏi; trong câu thường chỉ đọc nửa thấp." },
  { mark: "à", name: "Thanh 4", body: "Rơi mạnh từ cao xuống thấp — gần thanh nặng nhưng dứt khoát hơn." },
  { mark: "a", name: "Thanh nhẹ", body: "Ngắn, nhẹ, không dấu (ma, de, ne)." },
];

export default function Page() {
  const syllables = getSyllables();
  const groups = INITIALS.map((initial) => ({
    initial,
    syllables: syllables.filter((s) => s.initial === initial),
  })).filter((g) => g.syllables.length > 0);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Bảng pinyin</h1>
      <p className="mt-1 text-sm opacity-75">
        Mỗi âm được đọc bằng một chữ Hán có đúng âm đó (lấy từ từ vựng HSK1–4), nên một số thanh còn trống.
        Luyện nghe thanh ở trang{" "}
        <Link href="/tones" className="text-accent underline">
          Thanh điệu
        </Link>
        .
      </p>

      <h2 className="mt-6 text-lg font-semibold">4 thanh và thanh nhẹ</h2>
      <ul className="mt-2 grid gap-2 sm:grid-cols-5">
        {TONE_INFO.map((t) => (
          <li key={t.name} className="rounded border border-border p-3">
            <span className="text-2xl">{t.mark}</span> <span className="font-semibold">{t.name}</span>
            <p className="text-sm">{t.body}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Điểm khó cho người Việt</h2>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {TIPS.map((t) => (
          <li key={t.title} className="rounded border border-border p-3">
            <p className="font-semibold">{t.title}</p>
            <p className="text-sm">{t.body}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Bảng âm tiết ({syllables.length} âm)</h2>
      <PinyinGrid groups={groups} />
    </main>
  );
}
