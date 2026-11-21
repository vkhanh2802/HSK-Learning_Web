// Template mount lại mỗi lần đổi route nên animation chạy lại: hiệu ứng chuyển trang.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
