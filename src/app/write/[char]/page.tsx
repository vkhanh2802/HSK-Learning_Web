export default async function Page({ params }: { params: Promise<{ char: string }> }) {
  const { char } = await params;
  // Next.js trả param chữ Hán ở dạng còn mã hoá (%E6%88%91); URL lỗi thì giữ nguyên thay vì 500.
  let text = char;
  try {
    text = decodeURIComponent(char);
  } catch {}
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Viết chữ {text}</h1>
      <p>Đang xây dựng — Phase 4.</p>
    </main>
  );
}
