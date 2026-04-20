import { useEffect, useState } from "react";
import { apiRequest } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function StaffTicketsPage() {
  const { getToken, ready } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadTickets() {
    if (!ready) return;
    setLoading(true);
    try {
      const data = await apiRequest("/staff/tickets", {
        token: getToken("front_desk")
      });
      setTickets(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function resolveTicket(ticketId) {
    await apiRequest(`/staff/tickets/${ticketId}/resolve`, {
      method: "PATCH",
      token: getToken("front_desk")
    });
    await loadTickets();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-white">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-200/80">Staff inbox</p>
        <h1 className="mt-3 text-4xl font-semibold">Live escalation queue</h1>
      </div>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/20 backdrop-blur-xl">
        {loading ? <p className="p-4 text-slate-400">Loading tickets...</p> : null}

        {!loading && tickets.length === 0 ? <p className="p-4 text-slate-400">No open tickets yet.</p> : null}

        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div key={ticket._id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-400">{new Date(ticket.createdAt).toLocaleString()}</p>
                <h2 className="mt-1 text-lg font-semibold">{ticket.summary}</h2>
                <p className="text-sm text-slate-300">Status: {ticket.status} | Priority: {ticket.priority}</p>
              </div>
              {ticket.status !== "resolved" ? (
                <button
                  type="button"
                  onClick={() => resolveTicket(ticket._id)}
                  className="rounded-2xl bg-gradient-to-r from-amber-300 to-rose-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:from-amber-200 hover:to-rose-200"
                >
                  Mark Resolved
                </button>
              ) : (
                <span className="rounded-full bg-emerald-500/15 px-4 py-2 text-sm text-emerald-300">Resolved</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}