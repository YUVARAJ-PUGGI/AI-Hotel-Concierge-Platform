export default function MessageBubble({ message, index = 0 }) {
  const isUser = message.sender === "guest" || message.sender === "user";
  const senderLabel = isUser ? "You" : "Concierge";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`chat-bubble-enter max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "border border-cyan-200/30 bg-gradient-to-r from-cyan-300 to-emerald-300 text-slate-950 shadow-[0_12px_28px_rgba(16,185,129,0.3)]"
            : "border border-white/12 bg-white/10 text-slate-100 shadow-[0_12px_24px_rgba(5,10,28,0.38)]"
        }`}
        style={{ animationDelay: `${Math.min(index * 40, 280)}ms` }}
      >
        <p className={`mb-1 text-[10px] uppercase tracking-[0.18em] ${isUser ? "text-slate-800/80" : "text-slate-400"}`}>
          {senderLabel}
        </p>
        {message.text}
      </div>
    </div>
  );
}
