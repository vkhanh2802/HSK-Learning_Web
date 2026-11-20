import Link from "next/link";
import radicals from "../../../data/radicals.json";

export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">50 bộ thủ thường gặp</h1>
      <p className="mt-1 text-sm opacity-75">
        Bộ thủ là phần gợi nghĩa của chữ. Nhận ra bộ thủ giúp đoán nghĩa và nhớ chữ nhanh hơn. Bấm vào chữ ví dụ để tập viết.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {radicals.map((r) => (
          <li key={r.radical} className="flex gap-4 rounded border border-border p-4">
            <span lang="zh-CN" className="text-5xl leading-none">
              {r.radical}
            </span>
            <div>
              <p>
                <strong>{r.pinyin}</strong> — {r.vi}
              </p>
              {r.variants && (
                <p className="text-sm">
                  Dạng biến thể: <span lang="zh-CN" className="text-lg">{r.variants}</span>
                </p>
              )}
              <p className="mt-1 flex flex-wrap gap-2">
                {r.examples.map((c) => (
                  <Link key={c} href={`/write/${c}`} lang="zh-CN" className="text-2xl text-accent hover:underline">
                    {c}
                  </Link>
                ))}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
