export default function MessageBubble({ message }) {
  const isUser = message.sender === "guest" || message.sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-[#00D1B2] text-[#041015]"
            : "border border-white/10 bg-white/10 text-slate-100"
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}
