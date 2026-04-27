import EmptyState from "../common/EmptyState.jsx";
import Loader from "../common/Loader.jsx";
import TicketCard from "./TicketCard.jsx";

export default function TicketList({ tickets, loading, onResolve, onInProgress }) {
  if (loading) {
    return <Loader rows={4} />;
  }

  if (!tickets.length) {
    return (
      <EmptyState
        title="No active tickets"
        description="When guests escalate requests from concierge, they appear here in real time."
      />
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {tickets.map((ticket) => (
        <TicketCard key={ticket._id} ticket={ticket} onResolve={onResolve} onInProgress={onInProgress} />
      ))}
    </div>
  );
}