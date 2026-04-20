import { useEffect, useState } from "react";
import TicketList from "../components/staff/TicketList.jsx";
import { getTickets, resolveTicket } from "../api/staffApi.js";
import { useAppStore } from "../store/AppStoreContext.jsx";
import { useSocket } from "../hooks/useSocket.js";
import Badge from "../components/common/Badge.jsx";

export default function StaffDashboard() {
  const socket = useSocket();
  const { state } = useAppStore();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState([]);

  async function loadTickets() {
    if (!state.session.staffToken) return;

    setLoading(true);
    try {
      const list = await getTickets(state.session.staffToken);
      setTickets(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.session.staffToken]);

  useEffect(() => {
    socket.emit("subscribe:staff", {});

    const handleConciergeMessage = (payload) => {
      const preview = payload?.text ? payload.text.slice(0, 120) : "New concierge activity";
      setActivity((prev) => [
        {
          id: `${payload?.seq || Date.now()}-${Date.now()}`,
          title: payload?.sender === "guest" ? "Guest message" : "Assistant reply",
          preview,
          tone: payload?.sender === "guest" ? "accent" : "neutral"
        },
        ...prev
      ].slice(0, 6));

      if (payload?.sender === "guest") {
        loadTickets();
      }
    };

    const handleTicketCreated = (payload) => {
      setActivity((prev) => [
        {
          id: `${payload?.ticketId || Date.now()}`,
          title: "Ticket created",
          preview: payload?.summary || "New escalation triggered",
          tone: "warning"
        },
        ...prev
      ].slice(0, 6));
      loadTickets();
    };

    const handleTicketUpdated = (payload) => {
      setActivity((prev) => [
        {
          id: `${payload?.ticketId || Date.now()}-updated`,
          title: "Ticket updated",
          preview: `Status changed to ${payload?.status || "updated"}`,
          tone: "success"
        },
        ...prev
      ].slice(0, 6));
      loadTickets();
    };

    socket.on("concierge:message", handleConciergeMessage);
    socket.on("ticket:created", handleTicketCreated);
    socket.on("ticket:updated", handleTicketUpdated);

    return () => {
      socket.off("concierge:message", handleConciergeMessage);
      socket.off("ticket:created", handleTicketCreated);
      socket.off("ticket:updated", handleTicketUpdated);
    };
  }, [socket, state.session.staffToken]);

  async function handleResolve(ticketId) {
    await resolveTicket(ticketId, state.session.staffToken);
    await loadTickets();
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-amber-100">Staff dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Live guest support feed</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
            Watch guest chat activity arrive in real time, resolve escalations, and keep the hotel response loop tight.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/65 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Open tickets</p>
            <p className="mt-1 text-2xl font-semibold text-white">{tickets.filter((ticket) => ticket.status !== "resolved").length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/65 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Live notifications</p>
            <p className="mt-1 text-2xl font-semibold text-white">{activity.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="card-glass surface-elevated rounded-[1.75rem] p-5">
          <h2 className="text-xl font-semibold text-white">Realtime activity</h2>
          <div className="mt-4 space-y-3">
            {activity.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-slate-400">
                Guest chat activity will appear here as soon as a booking opens the concierge chat.
              </div>
            ) : null}

            {activity.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{item.title}</p>
                  <Badge tone={item.tone || "neutral"}>Live</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.preview}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card-glass surface-elevated rounded-[1.75rem] p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Open tickets</h2>
            <Badge tone="accent">Auto-refresh</Badge>
          </div>
          <div className="mt-4">
            <TicketList tickets={tickets} loading={loading} onResolve={handleResolve} />
          </div>
        </div>
      </div>
    </section>
  );
}