import OfflineDeck from "@/components/OfflineDeck";

export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Ôn offline</h1>
      <p className="mt-1 max-w-2xl text-sm opacity-75">
        Ôn thẻ từ bộ từ đã lưu trên máy, dùng được cả khi mất mạng (cần đã mở web có mạng ít nhất một lần trên thiết bị này).
        Kết quả ở đây không cập nhật lịch ôn — khi có mạng hãy vào trang Ôn tập.
      </p>
      <OfflineDeck />
    </main>
  );
}
