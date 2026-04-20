export default function Badge({ children, tone = "neutral", className = "" }) {
  const tones = {
    neutral: "bg-white/[0.08] text-slate-200 border-white/10",
    accent: "bg-amber-300/12 text-amber-100 border-amber-200/25",
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    danger: "bg-red-500/15 text-red-300 border-red-500/30"
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
