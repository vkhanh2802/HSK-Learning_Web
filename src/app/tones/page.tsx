import AudioButton from "@/components/AudioButton";
import ToneDrill from "@/components/ToneDrill";
import { getSyllables } from "@/lib/syllables";

// Biến điệu: chữ viết giữ dấu gốc, nhưng khi đọc thì đổi thanh.
const SANDHI = [
  {
    title: "Hai thanh 3 liền nhau: thanh 3 đầu đọc thành thanh 2",
    examples: [
      { hanzi: "你好", written: "nǐ hǎo", spoken: "ní hǎo" },
      { hanzi: "很好", written: "hěn hǎo", spoken: "hén hǎo" },
      { hanzi: "水果", written: "shuǐguǒ", spoken: "shuíguǒ" },
      { hanzi: "我买", written: "wǒ mǎi", spoken: "wó mǎi" },
    ],
  },
  {
    title: "不 bù: trước thanh 4 đọc thành bú; còn lại giữ bù",
    examples: [
      { hanzi: "不是", written: "bù shì", spoken: "bú shì" },
      { hanzi: "不去", written: "bù qù", spoken: "bú qù" },
      { hanzi: "不吃", written: "bù chī", spoken: "bù chī" },
      { hanzi: "不好", written: "bù hǎo", spoken: "bù hǎo" },
    ],
  },
  {
    title: "一 yī: trước thanh 4 đọc yí; trước thanh 1, 2, 3 đọc yì; đứng cuối hoặc đếm số giữ yī",
    examples: [
      { hanzi: "一个", written: "yī gè", spoken: "yí ge" },
      { hanzi: "一天", written: "yī tiān", spoken: "yì tiān" },
      { hanzi: "一年", written: "yī nián", spoken: "yì nián" },
      { hanzi: "十一", written: "shíyī", spoken: "shíyī" },
    ],
  },
];

export default function Page() {
  const syllables = getSyllables();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Luyện thanh điệu</h1>
      <p className="mt-1 text-sm opacity-75">
        Âm thanh đọc bằng chữ Hán có đúng âm đó, nên chỉ luyện được 4 thanh chính; thanh nhẹ luyện qua từ trong bài học.
      </p>

      <section className="mt-6 rounded border border-border p-4">
        <h2 className="text-lg font-semibold">Bài 1 — Nghe và chọn thanh</h2>
        <p className="mb-3 text-sm">Nghe một âm tiết bất kỳ, chọn thanh 1, 2, 3 hay 4.</p>
        <ToneDrill mode="single" syllables={syllables} />
      </section>

      <section className="mt-6 rounded border border-border p-4">
        <h2 className="text-lg font-semibold">Bài 2 — Cặp tối thiểu</h2>
        <p className="mb-3 text-sm">Cùng một âm tiết, khác thanh (mā / má / mǎ). Chọn đúng âm vừa nghe.</p>
        <ToneDrill mode="pairs" syllables={syllables} />
      </section>

      <section className="mt-6 rounded border border-border p-4">
        <h2 className="text-lg font-semibold">Bài 3 — Biến điệu</h2>
        {SANDHI.map((rule) => (
          <div key={rule.title} className="mt-4">
            <h3 className="font-semibold">{rule.title}</h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {rule.examples.map((e) => (
                <li key={e.hanzi} className="flex items-center gap-3 rounded border border-border p-2">
                  <span lang="zh-CN" className="text-2xl">
                    {e.hanzi}
                  </span>
                  <AudioButton text={e.hanzi} />
                  <span className="text-sm">
                    viết <strong>{e.written}</strong> → đọc <strong className="text-accent">{e.spoken}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
