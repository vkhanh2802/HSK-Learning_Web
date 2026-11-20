// Đọc tiếng Trung bằng giọng có sẵn của trình duyệt (Web Speech API). Chỉ gọi ở client.

function chineseVoice(): SpeechSynthesisVoice | undefined {
  const voices = speechSynthesis.getVoices();
  return voices.find((v) => v.lang === "zh-CN") ?? voices.find((v) => v.lang.startsWith("zh"));
}

/** Trả về false nếu máy không đọc được tiếng Trung (không hỗ trợ hoặc chưa cài giọng zh). */
export function speak(text: string, rate = 0.9): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const voice = chineseVoice();
  // getVoices() có thể rỗng lúc trang mới tải; khi đó vẫn thử đọc với lang zh-CN.
  if (!voice && speechSynthesis.getVoices().length > 0) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = rate;
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
  return true;
}
