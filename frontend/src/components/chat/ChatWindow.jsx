import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";
import InputBox from "./InputBox.jsx";

export default function ChatWindow({ messages, typing, input, onInputChange, onSend }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  return (
    <section className="card-glass rounded-3xl p-4 md:p-5">
      <div className="max-h-[520px] min-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-[#0f1525] p-4">
        {messages.map((message, index) => (
          <MessageBubble key={`${message.seq || index}-${index}`} message={message} />
        ))}
        {typing ? <p className="text-xs text-[#71f7e6]">HotelOS concierge is typing...</p> : null}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3">
        <InputBox value={input} onChange={onInputChange} onSend={onSend} />
      </div>
    </section>
  );
}
