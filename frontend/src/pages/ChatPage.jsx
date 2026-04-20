import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../hooks/useSocket.js";

export default function ChatPage() {
  const { bookingId } = useParams();
  const socket = useSocket();
  const { getToken, ready } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = useMemo(() => getToken("guest"), [getToken]);

  useEffect(() => {
    if (!bookingId || !ready) return;

    socket.emit("subscribe:booking", { bookingId });

    const handleTyping = (payload) => setTyping(Boolean(payload?.typing));
    const handleMessage = (payload) => {
      setMessages((prev) => [...prev, { sender: payload.sender, text: payload.text, seq: payload.seq }]);
    };

    socket.on("concierge:typing", handleTyping);
    socket.on("message:received", handleMessage);

    return () => {
      socket.off("concierge:typing", handleTyping);
      socket.off("message:received", handleMessage);
    };
  }, [bookingId, ready, socket]);

  useEffect(() => {
    async function loadHistory() {
      if (!ready || !bookingId) return;
      setLoading(true);

      try {
        const data = await apiRequest(`/concierge/history/${bookingId}`, { token });
        setMessages(data.map((item) => ({ sender: item.sender, text: item.text, seq: item.seq })));
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [bookingId, ready, token]);

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    setInput("");

    setMessages((prev) => [...prev, { sender: "guest", text, seq: Date.now() }]);

    await apiRequest("/concierge/message", {
      method: "POST",
      token,
      body: { bookingId, message: text }
    });
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-white">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-amber-200/80">Hotel concierge chat</p>
          <h1 className="mt-3 text-4xl font-semibold">Booking-locked assistant</h1>
        </div>
        <Link to="/" className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 hover:bg-white/5">
          New search
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/20 backdrop-blur-xl">
          <div className="min-h-[420px] space-y-3 rounded-[1rem] bg-slate-950/70 p-4">
            {loading ? <p className="text-slate-400">Loading chat history...</p> : null}

            {!loading && messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-6 text-slate-400">
                Ask anything about this hotel: room service, timings, policy, amenities, or local help.
              </div>
            ) : null}

            {messages.map((message, index) => (
              <div key={`${message.seq}-${index}`} className={`flex ${message.sender === "guest" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.sender === "guest"
                      ? "bg-amber-300 text-slate-950"
                      : "bg-white/10 text-slate-100"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {typing ? <p className="text-sm text-amber-200">Concierge is typing...</p> : null}
          </div>

          <div className="mt-4 flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Ask about room service, checkout, spa, cab, or anything hotel-specific..."
              className="flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={sendMessage}
              className="rounded-2xl bg-gradient-to-r from-amber-300 to-rose-300 px-6 py-4 font-semibold text-slate-950 transition hover:from-amber-200 hover:to-rose-200"
            >
              Send
            </button>
          </div>
        </div>

        <aside className="h-fit rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-5">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-200/80">How it works</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>• Chat is attached to one booking only</li>
            <li>• Hotel facts come from hotel-specific context</li>
            <li>• Unknown facts auto-escalate into a staff ticket</li>
            <li>• Staff can resolve issues in the ticket inbox</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}