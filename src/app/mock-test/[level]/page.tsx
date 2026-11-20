export default async function Page({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params;
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Thi thử HSK {level}</h1>
      <p>Đang xây dựng — Phase 11.</p>
    </main>
  );
}
