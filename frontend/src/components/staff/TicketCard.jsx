import Badge from "../common/Badge.jsx";
import Button from "../common/Button.jsx";

const PRIORITY_TONE = {
  low: "neutral",
  medium: "warning",
  high: "danger"
};

export default function TicketCard({ ticket, onResolve }) {
  const isResolved = ticket.status === "resolved";

  return (
    <article className="card-glass rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={PRIORITY_TONE[ticket.priority] || "neutral"}>{ticket.priority || "medium"}</Badge>
        <Badge tone={isResolved ? "success" : "accent"}>{isResolved ? "Resolved" : "Open"}</Badge>
      </div>

      <h3 className="mt-3 text-lg font-semibold text-white">{ticket.summary}</h3>
      <p className="mt-1 text-sm text-slate-300">Type: {ticket.type} | Booking: {String(ticket.bookingId).slice(-6)}</p>
      <p className="mt-1 text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleString()}</p>

      {!isResolved ? (
        <Button className="mt-4" onClick={() => onResolve(ticket._id)}>
          Resolve
        </Button>
      ) : null}
    </article>
  );
}
