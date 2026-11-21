// Nhận diện giọng nói tiếng Trung bằng Web Speech API của trình duyệt (Chrome/Edge; cần mạng). Chỉ gọi ở client.

// TypeScript DOM lib chưa có kiểu cho SpeechRecognition, khai báo phần cần dùng.
type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};
type RecognitionCtor = new () => Recognition;

function ctor(): RecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export const speechRecognitionSupported = () => !!ctor();

/** Lỗi đọc được cho người dùng từ mã lỗi của Web Speech API. */
export function speechErrorMessage(code: string): string {
  if (code === "not-allowed" || code === "service-not-allowed") return "Trình duyệt chưa được phép dùng micro.";
  if (code === "no-speech") return "Không nghe thấy gì, thử nói to và rõ hơn.";
  if (code === "audio-capture") return "Không tìm thấy micro.";
  if (code === "network") return "Nhận diện giọng nói cần kết nối mạng.";
  return `Lỗi nhận diện giọng nói (${code}).`;
}

/** Nghe một câu: trả về văn bản nhận diện được ("" nếu không nghe thấy). `stop()` để dừng sớm. */
export function recognizeOnce(lang = "zh-CN"): { result: Promise<string>; stop: () => void } {
  const Ctor = ctor();
  if (!Ctor) return { result: Promise.reject(new Error("unsupported")), stop: () => {} };
  const rec = new Ctor();
  rec.lang = lang;
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  const result = new Promise<string>((resolve, reject) => {
    let text = "";
    rec.onresult = (e) => (text = Array.from(e.results, (r) => r[0].transcript).join(""));
    rec.onerror = (e) => (e.error === "no-speech" ? resolve("") : reject(new Error(e.error)));
    rec.onend = () => resolve(text);
  });
  rec.start();
  return { result, stop: () => rec.stop() };
}
