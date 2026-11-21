import AudioButton from "@/components/AudioButton";
import ToneDrill from "@/components/ToneDrill";
import { getT } from "@/lib/lang-server";
import { getSyllables } from "@/lib/syllables";

// Biến điệu: chữ viết giữ dấu gốc, nhưng khi đọc thì đổi thanh.
const SANDHI = [
  {
    title: ["Hai thanh 3 liền nhau: thanh 3 đầu đọc thành thanh 2", "Two third tones in a row: the first is read as second tone"],
    examples: [
      { hanzi: "你好", written: "nǐ hǎo", spoken: "ní hǎo" },
      { hanzi: "很好", written: "hěn hǎo", spoken: "hén hǎo" },
      { hanzi: "水果", written: "shuǐguǒ", spoken: "shuíguǒ" },
      { hanzi: "我买", written: "wǒ mǎi", spoken: "wó mǎi" },
    ],
  },
  {
    title: ["不 bù: trước thanh 4 đọc thành bú; còn lại giữ bù", "不 bù: read as bú before a fourth tone; otherwise stays bù"],
    examples: [
      { hanzi: "不是", written: "bù shì", spoken: "bú shì" },
      { hanzi: "不去", written: "bù qù", spoken: "bú qù" },
      { hanzi: "不吃", written: "bù chī", spoken: "bù chī" },
      { hanzi: "不好", written: "bù hǎo", spoken: "bù hǎo" },
    ],
  },
  {
    title: [
      "一 yī: trước thanh 4 đọc yí; trước thanh 1, 2, 3 đọc yì; đứng cuối hoặc đếm số giữ yī",
      "一 yī: read as yí before a fourth tone; yì before tones 1, 2, 3; stays yī at the end or when counting",
    ],
    examples: [
      { hanzi: "一个", written: "yī gè", spoken: "yí ge" },
      { hanzi: "一天", written: "yī tiān", spoken: "yì tiān" },
      { hanzi: "一年", written: "yī nián", spoken: "yì nián" },
      { hanzi: "十一", written: "shíyī", spoken: "shíyī" },
    ],
  },
];

export default async function Page() {
  const t = await getT();
  const syllables = getSyllables();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{t("Luyện thanh điệu", "Tone practice")}</h1>
      <p className="mt-1 text-sm opacity-75">
        {t(
          "Âm thanh đọc bằng chữ Hán có đúng âm đó, nên chỉ luyện được 4 thanh chính; thanh nhẹ luyện qua từ trong bài học.",
          "Sounds are read aloud using a character with exactly that sound, so only the 4 main tones can be drilled; the neutral tone is practised through words in the lessons.",
        )}
      </p>

      <section className="mt-6 rounded border border-border p-4">
        <h2 className="text-lg font-semibold">{t("Bài 1 — Nghe và chọn thanh", "Drill 1 — Listen and pick the tone")}</h2>
        <p className="mb-3 text-sm">{t("Nghe một âm tiết bất kỳ, chọn thanh 1, 2, 3 hay 4.", "Listen to a syllable and choose tone 1, 2, 3 or 4.")}</p>
        <ToneDrill mode="single" syllables={syllables} />
      </section>

      <section className="mt-6 rounded border border-border p-4">
        <h2 className="text-lg font-semibold">{t("Bài 2 — Cặp tối thiểu", "Drill 2 — Minimal pairs")}</h2>
        <p className="mb-3 text-sm">{t("Cùng một âm tiết, khác thanh (mā / má / mǎ). Chọn đúng âm vừa nghe.", "Same syllable, different tone (mā / má / mǎ). Choose the one you just heard.")}</p>
        <ToneDrill mode="pairs" syllables={syllables} />
      </section>

      <section className="mt-6 rounded border border-border p-4">
        <h2 className="text-lg font-semibold">{t("Bài 3 — Biến điệu", "Drill 3 — Tone sandhi")}</h2>
        {SANDHI.map((rule) => (
          <div key={rule.title[0]} className="mt-4">
            <h3 className="font-semibold">{t(rule.title[0], rule.title[1])}</h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {rule.examples.map((e) => (
                <li key={e.hanzi} className="flex items-center gap-3 rounded border border-border p-2">
                  <span lang="zh-CN" className="text-2xl">
                    {e.hanzi}
                  </span>
                  <AudioButton text={e.hanzi} />
                  <span className="text-sm">
                    {t("viết", "written")} <strong>{e.written}</strong> → {t("đọc", "spoken")} <strong className="text-accent">{e.spoken}</strong>
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
