// Bảng âm tiết pinyin -> chữ Hán đại diện cho từng thanh, dựng từ danh sách từ HSK1–4.
// Giọng đọc của trình duyệt chỉ đọc chữ Hán, nên mỗi ô pinyin phát âm bằng một chữ có đúng âm đó.
// Chỉ dùng trong Server Component: các trang dùng nó được dựng sẵn lúc build, client chỉ nhận kết quả.
import hsk1 from "../../data/raw/hsk1.json";
import hsk2 from "../../data/raw/hsk2.json";
import hsk3 from "../../data/raw/hsk3.json";
import hsk4 from "../../data/raw/hsk4.json";
import curatedHsk1 from "../../data/vocab/hsk1.json";
import { numericToMarked, stripTone, toneOf } from "@/lib/pinyin";

type RawWord = { simplified: string; forms: { transcriptions: { numeric: string } }[] };
type Curated = Record<string, { pinyin: string }>;

export type ToneSample = { char: string; marked: string };
export type Syllable = { base: string; initial: string; tones: Partial<Record<1 | 2 | 3 | 4, ToneSample>> };

const INITIAL = /^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?/;

let cache: Syllable[] | null = null;

export function getSyllables(): Syllable[] {
  if (cache) return cache;

  // Mọi cách đọc (bỏ thanh nhẹ) của từng chữ, theo thứ tự cấp HSK để chữ dễ được chọn trước.
  const readings = new Map<string, Set<string>>();
  for (const list of [hsk1, hsk2, hsk3, hsk4] as RawWord[][])
    for (const w of list) {
      const chars = [...w.simplified];
      for (const f of w.forms) {
        const syl = f.transcriptions.numeric.toLowerCase().split(/\s+/);
        if (syl.length !== chars.length) continue;
        chars.forEach((c, i) => {
          if (syl[i].endsWith("5")) return;
          if (!readings.has(c)) readings.set(c, new Set());
          readings.get(c)!.add(syl[i]);
        });
      }
    }
  // Chữ HSK1 đứng riêng: dùng pinyin đã soạn tay (vd. 听 chỉ còn tīng, bỏ cách đọc hiếm yǐn).
  for (const [hanzi, v] of Object.entries(curatedHsk1 as Curated))
    if ([...hanzi].length === 1) {
      const p = v.pinyin.trim().toLowerCase();
      if (toneOf(p) === 5) readings.delete(hanzi); // 吗, 的…: thanh nhẹ không minh hoạ được bằng chữ đứng riêng
      else readings.set(hanzi, new Set([`${stripTone(p)}${toneOf(p)}`]));
    }

  const byBase = new Map<string, Syllable>();
  for (const [char, set] of readings) {
    // Chữ đa âm bị loại: giọng đọc có thể đọc chữ đó theo âm khác với ô đang bấm.
    if (set.size !== 1) continue;
    const numeric = [...set][0];
    const tone = Number(numeric.at(-1)) as 1 | 2 | 3 | 4;
    const base = numeric.slice(0, -1);
    if (!byBase.has(base)) byBase.set(base, { base, initial: INITIAL.exec(base)![0], tones: {} });
    const s = byBase.get(base)!;
    s.tones[tone] ??= { char, marked: numericToMarked(numeric) };
  }

  cache = [...byBase.values()].sort((a, b) => a.base.localeCompare(b.base));
  return cache;
}

let soundsCache: Record<string, string[]> | null = null;

/** Chữ -> mọi âm không thanh trong từ vựng HSK1–4 (gồm cả thanh nhẹ), để so chữ đồng âm khi chấm phát âm. */
export function charSounds(): Record<string, string[]> {
  if (soundsCache) return soundsCache;
  const map = new Map<string, Set<string>>();
  for (const list of [hsk1, hsk2, hsk3, hsk4] as RawWord[][])
    for (const w of list) {
      const chars = [...w.simplified];
      for (const f of w.forms) {
        const syl = f.transcriptions.numeric.toLowerCase().split(/\s+/);
        if (syl.length === chars.length)
          chars.forEach((c, i) => map.set(c, (map.get(c) ?? new Set()).add(syl[i].replace(/\d$/, ""))));
      }
    }
  soundsCache = Object.fromEntries([...map].map(([c, s]) => [c, [...s]]));
  return soundsCache;
}
