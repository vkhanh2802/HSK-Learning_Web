// Dựa trên loader "Generating" của dexter-st (Uiverse.io, giấy phép MIT), đổi chữ theo ngôn ngữ.
export default function Loader({ text }: { text: string }) {
  return (
    <div role="status" aria-label={text} className="uv-loader-wrapper">
      {[...text].map((c, i) => (
        <span key={i} aria-hidden className="uv-loader-letter" style={{ animationDelay: `${i * 0.1}s` }}>
          {c === " " ? " " : c}
        </span>
      ))}
      <div className="uv-loader" />
    </div>
  );
}
