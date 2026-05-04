import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";
import InputBox from "./InputBox.jsx";

export default function ChatWindow({ messages, typing, input, onInputChange, onSend, disabled, hotelName, welcomeText }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  return (
    <section className="card-glass concierge-chat-shell relative overflow-hidden rounded-3xl p-4 md:p-5">
      <div className="pointer-events-none absolute -left-24 top-6 h-36 w-36 rounded-full bg-amber-300/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-44 w-44 rounded-full bg-cyan-300/15 blur-3xl" />

      <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-amber-200">{welcomeText || (hotelName ? `Welcome to ${hotelName}` : "Welcome")}</p>
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Live Concierge</p>
          <h3 className="mt-1 text-sm font-semibold text-white">Food orders and room services</h3>
        </div>
        <span className="rounded-full border border-emerald-200/25 bg-emerald-200/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-200">
          Online
        </span>
      </div>

      <div className="max-h-[520px] min-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1328]/95 p-4">
        {messages.map((message, index) => (
          <MessageBubble key={`${message.seq || index}-${index}`} message={message} index={index} />
        ))}
        {typing ? (
          <div className="typing-pill inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-300/10 px-3 py-1.5 text-xs text-cyan-200">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
            Concierge is preparing your response
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3">
        <InputBox value={input} onChange={onInputChange} onSend={onSend} disabled={disabled} />
      </div>
    </section>
  );
}
