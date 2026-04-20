export default function Button({
  children,
  variant = "primary",
  className = "",
  disabled = false,
  ...props
}) {
  const variants = {
    primary:
      "bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-200 hover:via-orange-200 hover:to-rose-200",
    secondary: "border border-white/15 bg-white/5 text-slate-100 hover:border-amber-300/35 hover:bg-white/10",
    ghost: "bg-transparent text-slate-300 hover:bg-white/10"
  };

  return (
    <button
      disabled={disabled}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-soft hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
