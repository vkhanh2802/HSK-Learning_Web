"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { recordSpeaking } from "@/app/actions";
import AudioButton from "@/components/AudioButton";
import { useT } from "@/components/LangProvider";
import { alignSpeech } from "@/lib/compare";
import { recognizeOnce, speechErrorMessage, speechRecognitionSupported } from "@/lib/speech";

export type SpeakItem = { hanzi: string; pinyin: string; vi: string };
export type SpeakLesson = { id: number; title: string; words: SpeakItem[]; sentences: SpeakItem[] };

type Result = ReturnType<typeof alignSpeech> & { heard: string };
const noSubscribe = () => () => {};

/** Ghi âm micro bằng MediaRecorder để tự nghe lại; bản ghi chỉ giữ trong phiên (không lưu). */
function useRecorder() {
  const rec = useRef<MediaRecorder | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const start = async () => {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const r = new MediaRecorder(stream);
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return URL.createObjectURL(new Blob(chunks, { type: r.mimeType }));
        });
      };
      r.start();
      rec.current = r;
      return true;
    } catch {
      return false;
    }
  };
  const stop = () => {
    if (rec.current?.state === "recording") rec.current.stop();
    rec.current = null;
  };
  const reset = () =>
    setUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  return { url, start, stop, reset };
}

function SpeakCard({ item, sounds }: { item: SpeakItem; sounds: Record<string, string[]> }) {
  const t = useT();
  const [state, setState] = useState<"idle" | "listening" | "recording">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPinyin, setShowPinyin] = useState(true);
  const stopRecognition = useRef<() => void>(() => {});
  const recorder = useRecorder();
  // Server không biết trình duyệt có hỗ trợ không: giả định có, client đọc giá trị thật sau hydrate.
  const canRecognize = useSyncExternalStore(noSubscribe, speechRecognitionSupported, () => true);

  const speak = async () => {
    setError(null);
    setResult(null);
    recorder.reset();
    await recorder.start(); // ghi âm song song để tự nghe lại; thiếu quyền micro thì bỏ qua
    setState("listening");
    const { result: heardPromise, stop } = recognizeOnce();
    stopRecognition.current = stop;
    try {
      const heard = await heardPromise;
      const r = { ...alignSpeech(item.hanzi, heard, sounds), heard };
      setResult(r);
      recordSpeaking({ text: item.hanzi, heard, score: r.score }).catch(() => {});
    } catch (e) {
      setError(speechErrorMessage((e as Error).message, t));
    } finally {
      recorder.stop();
      setState("idle");
    }
  };

  // Không có nhận diện giọng nói: chỉ ghi âm rồi tự nghe so với mẫu.
  const toggleRecord = async () => {
    if (state === "recording") {
      recorder.stop();
      setState("idle");
    } else if (await recorder.start()) setState("recording");
    else setError(t("Không dùng được micro (chưa cho phép hoặc trình duyệt không hỗ trợ ghi âm).", "Cannot use the microphone (permission denied or recording unsupported)."));
  };

  const pct = result ? Math.round(result.score * 100) : 0;

  return (
    <div className="animate-card-swap rounded border border-border bg-muted/25 p-5">
      <p lang="zh-CN" className="text-4xl leading-relaxed">
        {result
          ? result.chars.map((c, i) => (
              <span key={i} className={c.ok ? "" : "text-accent underline decoration-wavy"}>
                {c.c}
              </span>
            ))
          : item.hanzi}
      </p>
      {showPinyin && <p className="mt-1 text-lg">{item.pinyin}</p>}
      <p className="text-sm opacity-75">{item.vi}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <AudioButton key={item.hanzi} text={item.hanzi} label={t("Nghe mẫu", "Play model")} />
        {canRecognize ? (
          state === "listening" ? (
            <button type="button" onClick={() => stopRecognition.current()} className="animate-mic-pulse rounded bg-accent px-4 py-2 font-semibold text-background">
              {t("⏹ Đang nghe… bấm để dừng", "⏹ Listening… tap to stop")}
            </button>
          ) : (
            <button type="button" onClick={speak} className="rounded bg-accent px-4 py-2 font-semibold text-background">
              {t("🎙 Nói", "🎙 Speak")}
            </button>
          )
        ) : (
          <button type="button" onClick={toggleRecord} className={`${state === "recording" ? "animate-mic-pulse " : ""}rounded bg-accent px-4 py-2 font-semibold text-background`}>
            {state === "recording" ? t("⏹ Dừng ghi âm", "⏹ Stop recording") : t("🎙 Ghi âm", "🎙 Record")}
          </button>
        )}
        <button
          type="button"
          aria-pressed={showPinyin}
          onClick={() => setShowPinyin(!showPinyin)}
          className="rounded border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          {showPinyin ? t("Ẩn pinyin", "Hide pinyin") : t("Hiện pinyin", "Show pinyin")}
        </button>
      </div>

      {!canRecognize && (
        <p className="mt-2 text-sm opacity-75">
          {t("Trình duyệt không hỗ trợ nhận diện giọng nói (dùng Chrome hoặc Edge để được chấm điểm). Vẫn ghi âm được để tự nghe so với mẫu.", "This browser does not support speech recognition (use Chrome or Edge to get scored). You can still record yourself and compare with the model.")}
        </p>
      )}
      {error && (
        <p role="alert" className="animate-shake mt-2 text-sm font-semibold">
          {error}
        </p>
      )}
      {result && (
        <div role="status" className="animate-pop mt-4 rounded-lg bg-muted/70 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-lg font-semibold">
              {t("Khớp", "Match")} {pct}% {pct >= 80 ? t("✓ Tốt lắm!", "✓ Great!") : t("— thử lại nhé", "— try again")}
            </p>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-background/70">
            <div className="progress-fill h-full rounded-full bg-brush" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-sm">
            {t("Máy nghe được:", "Heard:")} <span lang="zh-CN">{result.heard || t("(không nghe rõ)", "(unclear)")}</span>
          </p>
          {pct < 100 && <p className="text-sm opacity-75">{t("Chữ gạch đỏ là chữ máy chưa nghe ra.", "Underlined characters were not recognised.")}</p>}
        </div>
      )}
      {recorder.url && (
        <div className="animate-pop mt-3">
          <p className="text-sm">{t("Bản ghi của bạn:", "Your recording:")}</p>
          <audio controls src={recorder.url} className="mt-1" />
        </div>
      )}
    </div>
  );
}

export default function SpeakingPractice({ lessons, sounds }: { lessons: SpeakLesson[]; sounds: Record<string, string[]> }) {
  const t = useT();
  const [lessonId, setLessonId] = useState(lessons[0]?.id);
  const [mode, setMode] = useState<"sentences" | "words">("sentences");
  const [i, setI] = useState(0);
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) return <p className="mt-4">{t("Chưa có bài học.", "No lessons yet.")}</p>;
  const items = lesson[mode];
  const item = items[Math.min(i, items.length - 1)];

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          {t("Bài", "Lesson")}
          <select
            value={lessonId}
            onChange={(e) => {
              setLessonId(Number(e.target.value));
              setI(0);
            }}
            className="rounded border border-border bg-background px-2 py-1"
          >
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
        <div role="group" aria-label={t("Luyện theo", "Practise by")} className="flex gap-1 text-sm">
          {(["sentences", "words"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => {
                setMode(m);
                setI(0);
              }}
              className={`rounded border border-border px-3 py-1 ${mode === m ? "bg-accent font-semibold text-background" : "hover:bg-muted"}`}
            >
              {m === "sentences" ? t("Câu (shadowing)", "Sentences (shadowing)") : t("Từ", "Words")}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm opacity-75">
        {mode === "sentences" ? t("Câu", "Sentence") : t("Từ", "Word")} {Math.min(i, items.length - 1) + 1}/{items.length}
      </p>
      {item && <SpeakCard key={`${lesson.id}-${mode}-${item.hanzi}`} item={item} sounds={sounds} />}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={i === 0}
          onClick={() => setI(i - 1)}
          className="rounded border border-border px-4 py-2 hover:bg-muted disabled:opacity-40"
        >
          {t("← Trước", "← Previous")}
        </button>
        <button
          type="button"
          disabled={i >= items.length - 1}
          onClick={() => setI(i + 1)}
          className="rounded border border-border px-4 py-2 hover:bg-muted disabled:opacity-40"
        >
          {t("Tiếp →", "Next →")}
        </button>
      </div>
    </div>
  );
}
