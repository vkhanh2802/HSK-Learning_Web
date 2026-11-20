export default async function Page({ params }: { params: Promise<{ levelId: string }> }) {
  const { levelId } = await params;
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Danh sách bài HSK {levelId}</h1>
      <p>Đang xây dựng — Phase 3.</p>
    </main>
  );
}
