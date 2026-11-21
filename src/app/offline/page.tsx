import OfflineDeck from "@/components/OfflineDeck";
import { getT } from "@/lib/lang-server";

export default async function Page() {
  const t = await getT();
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{t("Ôn offline", "Offline review")}</h1>
      <p className="mt-1 max-w-2xl text-sm opacity-75">
        {t(
          "Ôn thẻ từ bộ từ đã lưu trên máy, dùng được cả khi mất mạng (cần đã mở web có mạng ít nhất một lần trên thiết bị này). Kết quả ở đây không cập nhật lịch ôn — khi có mạng hãy vào trang Ôn tập.",
          "Review cards from the word set saved on this device, even without a connection (open the site online at least once on this device first). Results here do not update your review schedule — go to Review when you are back online.",
        )}
      </p>
      <OfflineDeck />
    </main>
  );
}
