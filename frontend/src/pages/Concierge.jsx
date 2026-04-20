import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ChatWindow from "../components/chat/ChatWindow.jsx";
import QuickActions from "../components/chat/QuickActions.jsx";
import Badge from "../components/common/Badge.jsx";
import { getConciergeHistory, sendConciergeMessage } from "../api/conciergeApi.js";
import { useAppStore } from "../store/AppStoreContext.jsx";
import { useSocket } from "../hooks/useSocket.js";

export default function Concierge() {
  const { bookingId } = useParams();
  const socket = useSocket();
  const { state } = useAppStore();
  const token = state.session.guestToken;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [requestStatus, setRequestStatus] = useState([
    { label: "Welcome support", status: "Completed" }
  ]);

  const summaryItems = useMemo(
    () => [
      { label: "Booking ID", value: bookingId },
      { label: "Support SLA", value: "< 2 min" },
      { label: "Channel", value: "HotelOS Concierge" }
    ],
    [bookingId]
  );

  useEffect(() => {
    if (!bookingId || !token) return;

    async function loadHistory() {
      const history = await getConciergeHistory(bookingId, token);
      setMessages(history.map((item) => ({ sender: item.sender, text: item.text, seq: item.seq })));
    }

    loadHistory();
  }, [bookingId, token]);

  useEffect(() => {
    if (!bookingId) return;

    socket.emit("subscribe:booking", { bookingId });

    const onTyping = (payload) => setTyping(Boolean(payload.typing));
    const onMessage = (payload) => {
      setMessages((prev) => [...prev, payload]);
    };
    const onTicketUpdate = () => {
      setRequestStatus((prev) => [
        { label: "Front desk request", status: "In Progress" },
        ...prev
      ]);
    };

    socket.on("concierge:typing", onTyping);
    socket.on("message:received", onMessage);
    socket.on("ticket:updated", onTicketUpdate);

    return () => {
      socket.off("concierge:typing", onTyping);
      socket.off("message:received", onMessage);
      socket.off("ticket:updated", onTicketUpdate);
    };
  }, [bookingId, socket]);

  async function postMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || !token) return;

    setMessages((prev) => [...prev, { sender: "guest", text: trimmed, seq: Date.now() }]);
    setInput("");

    const response = await sendConciergeMessage({ bookingId, message: trimmed }, token);

    if (response.escalated) {
      setRequestStatus((prev) => [
        { label: "Escalated request", status: "Pending" },
        ...prev
      ]);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[280px_1fr_280px]">
      <aside className="card-glass rounded-3xl p-5">
        <h3 className="text-lg font-semibold text-white">Booking Summary</h3>
        <div className="mt-4 space-y-3 text-sm">
          {summaryItems.map((item) => (
            <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
              <p className="mt-1 text-slate-100">{item.value}</p>
            </div>
          ))}
        </div>

        <h4 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-300">Quick actions</h4>
        <div className="mt-3">
          <QuickActions onAction={postMessage} />
        </div>
      </aside>

      <ChatWindow
        messages={messages}
        typing={typing}
        input={input}
        onInputChange={setInput}
        onSend={() => postMessage(input)}
      />

      <aside className="card-glass rounded-3xl p-5">
        <h3 className="text-lg font-semibold text-white">Service Status</h3>
        <div className="mt-4 space-y-3">
          {requestStatus.map((entry, index) => (
            <div key={`${entry.label}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm text-slate-100">{entry.label}</p>
              <div className="mt-2">
                <Badge tone={entry.status === "Completed" ? "success" : entry.status === "In Progress" ? "warning" : "accent"}>
                  {entry.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
