"use client";

import { useEffect, useState } from "react";
import { speak } from "@/lib/tts";
import type { Example } from "@/lib/words";

type Card = { hanzi: string; pinyin: string; vi: string; example: Example | null };
type Deck = { learned: boolean; savedAt: string; words: Card[] };

/**
 * Thẻ lật đơn giản trên bộ từ đã lưu (service worker trả bản cache khi mất mạng).
 * shortcut: chấm Nhớ/Quên chỉ để xếp lại thẻ trong lượt, không ghi lịch FSRS; muốn đồng bộ thì cần hàng đợi gửi lại khi có mạng.
 */
export default function OfflineDeck() {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [error, setError] = useState(false);
  const [queue, setQueue] = useState<number[]>([]);
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(0);

  useEffect(() => {
    fetch("/api/offline-deck")
      .then((r) => (r.ok ? (r.json() as Promise<Deck>) : Promise.reject()))
      .then((d) => {
        setDeck(d);
        setQueue(d.words.map((_, i) => i));
      })
      .catch(() => setError(true));
  }, []);

  if (error) return <p className="mt-6">Chưa có bộ từ lưu trên máy này. Hãy mở web khi có mạng rồi quay lại.</p>;
  if (!deck) return <p className="mt-6">Đang tải bộ từ…</p>;
  if (queue.length === 0)
    return (
      <p role="status" className="mt-6 text-lg">
        Xong lượt ôn: {done} thẻ. 🎉
      </p>
    );

  const card = deck.words[queue[0]];
  const next = (remember: boolean) => {
    setShown(false);
    if (remember) setDone((n) => n + 1);
    // Quên thì đưa thẻ về cuối hàng để gặp lại trong lượt.
    setQueue(([head, ...rest]) => (remember ? rest : [...rest, head]));
  };

  return (
    <div className="mt-6 max-w-md">
      <p className="text-sm opacity-75">
        Còn {queue.length} thẻ · {deck.learned ? "từ đã học" : "từ vựng HSK1"} · lưu lúc{" "}
        {new Date(deck.savedAt).toLocaleString("vi-VN")}
      </p>
      <div className="mt-3 rounded border border-border p-6 text-center">
        <button type="button" onClick={() => speak(card.hanzi)} lang="zh-CN" className="text-5xl" aria-label={`Nghe ${card.hanzi}`}>
          {card.hanzi}
        </button>
        {shown ? (
          <div className="mt-3">
            <p className="text-lg">{card.pinyin}</p>
            <p>{card.vi}</p>
            {card.example && (
              <p className="mt-2 text-sm opacity-75">
                <span lang="zh-CN">{card.example.hanzi}</span> — {card.example.vi}
              </p>
            )}
            <div className="mt-4 flex justify-center gap-3">
              <button type="button" onClick={() => next(false)} className="rounded border border-border px-4 py-2 hover:bg-muted">
                Quên
              </button>
              <button type="button" onClick={() => next(true)} className="rounded bg-accent px-4 py-2 font-semibold text-background">
                Nhớ
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setShown(true)} className="mt-4 rounded bg-accent px-4 py-2 font-semibold text-background">
            Hiện đáp án
          </button>
        )}
      </div>
    </div>
  );
}
