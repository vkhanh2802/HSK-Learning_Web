"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { submitMockTest } from "@/app/actions";
import { ReorderSentence } from "@/components/GrammarPractice";
import { useT } from "@/components/LangProvider";
import Picture from "@/components/Picture";
import { SKILL_EN, SKILL_VI, type Skill } from "@/lib/mock";
import type { ClientMockItem, Response } from "@/lib/mockData";
import type { Token } from "@/lib/passages";
import { speakLines } from "@/lib/tts";

export type RunnerSection = { skill: Skill; minutes: number; items: ClientMockItem[] };

const pick = (on: boolean) => (on ? "border-accent bg-accent/15" : "hover:bg-muted");
const btn = "rounded border border-border px-4 py-2 text-left";

function Zh({ hanzi, pinyin, showPinyin }: { hanzi: string; pinyin?: string; showPinyin: boolean }) {
  return (
    <span>
      <span lang="zh-CN" className="text-lg">
        {hanzi}
      </span>
      {showPinyin && pinyin && <span className="ml-2 text-sm opacity-75">{pinyin}</span>}
    </span>
  );
}

function PassageText({ lines, showPinyin }: { lines: Token[][]; showPinyin: boolean }) {
  return (
    <div lang="zh-CN" className="mb-3 rounded bg-muted p-4 text-xl leading-loose">
      {lines.map((line, i) => (
        <p key={i}>
          {line.map((t, j) =>
            showPinyin && t.p ? (
              <ruby key={j}>
                {t.t}
                <rt className="text-xs">{t.p}</rt>
              </ruby>
            ) : (
              <span key={j}>{t.t}</span>
            ),
          )}
        </p>
      ))}
    </div>
  );
}

function ItemBody({
  item,
  value,
  set,
  showPinyin,
  playsLeft,
  play,
}: {
  item: ClientMockItem;
  value: Response | undefined;
  set: (v: Response) => void;
  showPinyin: boolean;
  playsLeft: number;
  play: () => void;
}) {
  const tx = useT();
  if (item.kind === "gr") {
    const ex = item.ex;
    if (ex.type === "reorder")
      return (
        <div>
          <p className="mb-2">{tx("Sắp xếp thành câu:", "Reorder into a sentence:")} {ex.vi}</p>
          <ReorderSentence words={ex.words} disabled={false} onChange={set} />
        </div>
      );
    return (
      <div>
        <p className="mb-2">{ex.type === "choose" ? <Zh hanzi={ex.prompt.hanzi} showPinyin={false} /> : tx("Chọn câu SAI:", "Pick the WRONG sentence:")}</p>
        {/* Câu "chọn câu đúng" không có ngữ cảnh chữ Hán quanh ___ thì đề nằm ở nghĩa tiếng Việt. */}
        {ex.type === "choose" && !/[一-鿿].*___|___.*[一-鿿]/.test(ex.prompt.hanzi) && (
          <p className="mb-2 text-sm opacity-75">{ex.prompt.vi}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {ex.options.map((o, i) => (
            <button key={i} type="button" onClick={() => set(i)} className={`${btn} ${pick(value === i)}`}>
              <span lang="zh-CN" className="text-lg">
                {o}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (item.kind === "pq") {
    const q = item.q;
    return (
      <div>
        {q.type === "tf" && <Zh hanzi={q.statement.hanzi} pinyin={q.statement.pinyin} showPinyin={showPinyin} />}
        {q.type === "mcq" && <Zh hanzi={q.question.hanzi} pinyin={q.question.pinyin} showPinyin={showPinyin} />}
        {q.type === "picture" && <Zh hanzi={q.sentence.hanzi} pinyin={q.sentence.pinyin} showPinyin={showPinyin} />}
        <div className="mt-2 flex flex-wrap gap-2">
          {q.type === "tf" &&
            [true, false].map((v) => (
              <button key={String(v)} type="button" onClick={() => set(v)} className={`${btn} min-w-24 ${pick(value === v)}`}>
                {v ? tx("✓ Đúng", "✓ True") : tx("✗ Sai", "✗ False")}
              </button>
            ))}
          {q.type === "mcq" &&
            q.options.map((o, i) => (
              <button key={i} type="button" onClick={() => set(i)} className={`${btn} ${pick(value === i)}`}>
                <Zh hanzi={o.hanzi} pinyin={o.pinyin} showPinyin={showPinyin} />
              </button>
            ))}
          {q.type === "picture" &&
            q.options.map((o, i) => (
              <button key={i} type="button" aria-label={o.label} onClick={() => set(i)} className={`rounded border-2 p-1.5 ${pick(value === i)}`}>
                <Picture picture={o} size={110} />
              </button>
            ))}
        </div>
      </div>
    );
  }

  const ex = item.exercise;
  if (ex.type === "fill")
    return (
      <div>
        <Zh hanzi={ex.payload.sentence} showPinyin={false} />
        <p className="text-sm opacity-75">{ex.payload.pinyin}</p>
        <input
          lang="zh-CN"
          aria-label={tx("Chữ còn thiếu", "Missing character")}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => set(e.target.value)}
          maxLength={4}
          className="mt-2 w-24 rounded border border-border bg-background px-3 py-2 text-xl"
        />
      </div>
    );
  if (ex.type === "reorder")
    return (
      <div>
        <p className="mb-2">{tx("Sắp xếp thành câu:", "Reorder into a sentence:")} {ex.payload.vi}</p>
        <ReorderSentence words={ex.payload.words} disabled={false} onChange={set} />
      </div>
    );
  if (ex.type === "compose") return null; // không có trong đề (cần AI chấm)

  // Bài nghe: nút nghe giới hạn số lần.
  return (
    <div>
      <button
        type="button"
        onClick={play}
        disabled={playsLeft <= 0}
        className="rounded bg-accent px-3 py-1.5 font-semibold text-background disabled:opacity-40"
      >
        🔊 {tx("Nghe", "Listen")} {playsLeft > 0 ? tx(`(còn ${playsLeft} lần)`, `(${playsLeft} left)`) : tx("(hết lượt)", "(no plays left)")}
      </button>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {ex.type === "picture_tf" && (
          <>
            <Picture picture={ex.payload.picture} size={130} />
            {[true, false].map((v) => (
              <button key={String(v)} type="button" onClick={() => set(v)} className={`${btn} min-w-24 ${pick(value === v)}`}>
                {v ? tx("✓ Đúng", "✓ True") : tx("✗ Sai", "✗ False")}
              </button>
            ))}
          </>
        )}
        {ex.type === "picture_mcq" &&
          ex.payload.options.map((o, i) => (
            <button key={i} type="button" aria-label={o.label} onClick={() => set(i)} className={`rounded border-2 p-1.5 ${pick(value === i)}`}>
              <Picture picture={o} size={110} />
            </button>
          ))}
        {ex.type === "mcq" && (
          <div>
            <p className="mb-2">
              <Zh hanzi={ex.payload.question.hanzi} pinyin={ex.payload.question.pinyin} showPinyin={showPinyin} />
            </p>
            <div className="flex flex-wrap gap-2">
              {ex.payload.options.map((o, i) => (
                <button key={i} type="button" onClick={() => set(i)} className={`${btn} ${pick(value === i)}`}>
                  <Zh hanzi={o.hanzi} pinyin={o.pinyin} showPinyin={showPinyin} />
                </button>
              ))}
            </div>
          </div>
        )}
        {ex.type === "dictation" && (
          <input
            lang="zh-CN"
            aria-label={tx("Chép lại câu vừa nghe (chữ Hán hoặc pinyin)", "Copy the sentence you heard (characters or pinyin)")}
            placeholder={tx("Chữ Hán hoặc pinyin", "Characters or pinyin")}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => set(e.target.value)}
            maxLength={200}
            className="w-full max-w-md rounded border border-border bg-background px-3 py-2 text-lg"
          />
        )}
      </div>
    </div>
  );
}

const fmt = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/**
 * Làm một đề thi thử: từng phần có đồng hồ đếm ngược, hết giờ tự sang phần sau; bài nghe giới hạn số lần nghe.
 * Chưa chấm gì ở client — nộp cả bài một lần cho server action submitMockTest.
 * shortcut: bài làm chỉ giữ trong bộ nhớ trang, tải lại trang là mất; lưu localStorage nếu cần làm tiếp sau khi tải lại.
 */
export default function MockTestRunner({
  testId,
  level,
  maxPlays,
  sections,
}: {
  testId: number;
  level: number;
  maxPlays: number;
  sections: RunnerSection[];
}) {
  const router = useRouter();
  const tx = useT();
  const skillName = (s: Skill) => tx(SKILL_VI[s], SKILL_EN[s]);
  const [idx, setIdx] = useState(0);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Response>>({});
  const [plays, setPlays] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();
  const showPinyin = level <= 2;

  const section = sections[idx];
  const last = idx === sections.length - 1;
  const numberOffset = sections.slice(0, idx).reduce((n, s) => n + s.items.length, 0);

  const submit = () => {
    setDeadline(null);
    setError(null);
    startTransition(async () => {
      try {
        const resultId = await submitMockTest({ testId, answers });
        setSubmitted(true);
        router.push(`/mock-test/result/${resultId}`);
      } catch {
        setError(tx("Không nộp được bài, thử lại.", "Could not submit, please try again."));
      }
    });
  };

  const finishSection = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) speechSynthesis.cancel();
    if (last) submit();
    else {
      setDeadline(null);
      setIdx(idx + 1);
      window.scrollTo(0, 0);
    }
  };

  // Hết giờ: interval gọi bản finishSection mới nhất qua ref.
  const finishRef = useRef(finishSection);
  useEffect(() => {
    finishRef.current = finishSection;
  });
  useEffect(() => {
    if (deadline === null) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= deadline) finishRef.current();
    }, 1000);
    return () => clearInterval(t);
  }, [deadline]);

  const start = () => {
    const n = Date.now();
    setNow(n);
    setDeadline(n + section.minutes * 60_000);
  };

  const confirmFinish = () => {
    const missing = section.items.filter((i) => answers[i.ref] === undefined).length;
    if (missing && !window.confirm(tx(`Còn ${missing} câu chưa làm. Vẫn ${last ? "nộp bài" : "sang phần sau"}?`, `${missing} questions are unanswered. ${last ? "Submit anyway?" : "Move on to the next section anyway?"}`))) return;
    finishSection();
  };

  if (pending || submitted)
    return <p className="mt-6">{tx("Đang chấm bài…", "Grading…")}</p>;

  if (deadline === null)
    return (
      <div className="mt-6 max-w-xl rounded border border-border p-6">
        <p className="text-sm opacity-75">
          {tx("Phần", "Section")} {idx + 1}/{sections.length}
        </p>
        <h2 className="text-xl font-bold">
          {skillName(section.skill)}: {section.items.length} {tx("câu", "questions")} · {section.minutes} {tx("phút", "min")}
        </h2>
        {section.skill === "listening" && (
          <p className="mt-2 text-sm">{tx(`Mỗi câu được nghe tối đa ${maxPlays} lần. Hết giờ phần này tự chuyển sang phần sau.`, `Each item can be played at most ${maxPlays} times. When time runs out the test moves on to the next section.`)}</p>
        )}
        {error && (
          <p role="alert" className="mt-2 font-semibold">
            {error}
          </p>
        )}
        <button type="button" onClick={error ? submit : start} className="mt-4 rounded bg-accent px-5 py-2 font-semibold text-background">
          {error ? tx("Nộp lại", "Resubmit") : tx("Bắt đầu", "Start")}
        </button>
      </div>
    );

  const left = Math.max(0, deadline - now);
  const done = section.items.filter((i) => answers[i.ref] !== undefined).length;

  return (
    <div className="mt-4">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b border-border bg-background py-2">
        <span className="font-semibold">
          {skillName(section.skill)} ({idx + 1}/{sections.length})
        </span>
        <span role="timer" aria-label={tx("Thời gian còn lại", "Time remaining")} className={`font-mono text-lg ${left < 60_000 ? "text-accent" : ""}`}>
          ⏱ {fmt(left)}
        </span>
        <span className="text-sm opacity-75">
          {tx("Đã làm", "Answered")} {done}/{section.items.length}
        </span>
        <button type="button" onClick={confirmFinish} className="ml-auto rounded bg-accent px-4 py-1.5 font-semibold text-background">
          {last ? tx("Nộp bài", "Submit") : tx("Sang phần sau", "Next section")}
        </button>
      </div>

      <ol className="mt-4 space-y-4">
        {section.items.map((item, i) => {
          const prev = section.items[i - 1];
          const newPassage = item.kind === "pq" && !(prev?.kind === "pq" && prev.passage.id === item.passage.id);
          const audio = item.kind === "ex" && "audio" in item.exercise.payload ? item.exercise.payload.audio : null;
          return (
            <li key={item.ref}>
              {newPassage && item.kind === "pq" && <PassageText lines={item.passage.lines} showPinyin={showPinyin} />}
              <div className="rounded border border-border p-4">
                <p className="mb-2 text-sm opacity-75">{tx("Câu", "Question")} {numberOffset + i + 1}</p>
                <ItemBody
                  item={item}
                  value={answers[item.ref]}
                  set={(v) => setAnswers((a) => ({ ...a, [item.ref]: v }))}
                  showPinyin={showPinyin}
                  playsLeft={maxPlays - (plays[item.ref] ?? 0)}
                  play={() => {
                    if (!audio) return;
                    speakLines(audio.map((l) => ({ text: l.hanzi, speaker: l.speaker })));
                    setPlays((p) => ({ ...p, [item.ref]: (p[item.ref] ?? 0) + 1 }));
                  }}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
