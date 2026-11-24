// Đọc tiếng Trung bằng giọng có sẵn của trình duyệt (Web Speech API). Chỉ gọi ở client.

function chineseVoice(): SpeechSynthesisVoice | undefined {
  const voices = speechSynthesis.getVoices();
  return voices.find((v) => v.lang === "zh-CN") ?? voices.find((v) => v.lang.startsWith("zh"));
}

const VOLUME_KEY = "volume";

/** Âm lượng 0–1 người dùng chọn ở thanh trượt trên header; mặc định 1. */
export function getVolume(): number {
  try {
    const v = Number(localStorage.getItem(VOLUME_KEY) ?? 1);
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1;
  } catch {
    return 1;
  }
}

export function setVolume(v: number) {
  try {
    localStorage.setItem(VOLUME_KEY, String(v));
  } catch {} // trình duyệt chặn storage: giữ nguyên âm lượng cũ
  window.dispatchEvent(new Event("volume-change"));
}

export type SpeakLine = { text: string; speaker?: "nam" | "nữ" };

/**
 * Đọc lần lượt nhiều câu (hội thoại). Người nói nam/nữ đổi cao độ để dễ phân biệt khi chỉ có một giọng.
 * Trả về false nếu máy không đọc được tiếng Trung (không hỗ trợ hoặc chưa cài giọng zh).
 */
export function speakLines(lines: SpeakLine[], rate = 0.9): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const voice = chineseVoice();
  // getVoices() có thể rỗng lúc trang mới tải; khi đó vẫn thử đọc với lang zh-CN.
  if (!voice && speechSynthesis.getVoices().length > 0) return false;
  speechSynthesis.cancel();
  for (const line of lines) {
    const u = new SpeechSynthesisUtterance(line.text);
    u.lang = "zh-CN";
    u.rate = rate;
    u.volume = getVolume();
    u.pitch = line.speaker === "nam" ? 0.8 : line.speaker === "nữ" ? 1.3 : 1;
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  }
  return true;
}

export function speak(text: string, rate = 0.9): boolean {
  return speakLines([{ text }], rate);
}
