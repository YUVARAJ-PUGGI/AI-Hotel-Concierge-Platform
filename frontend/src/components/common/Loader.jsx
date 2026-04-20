export default function Loader({ rows = 3, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="animate-shimmer h-16 rounded-xl bg-white/5" />
      ))}
    </div>
  );
}
