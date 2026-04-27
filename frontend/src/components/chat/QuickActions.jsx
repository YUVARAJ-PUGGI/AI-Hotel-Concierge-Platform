import Button from "../common/Button.jsx";

const ACTIONS = [
  { label: "Order dinner", text: "Please place a room-service dinner order for my room." },
  { label: "Order coffee", text: "Please send 2 hot coffees to my room." },
  { label: "Request towels", text: "Please send 2 extra towels to my room." },
  { label: "Housekeeping", text: "Please send housekeeping for quick room cleaning." },
  { label: "Late checkout", text: "Can I request a late checkout?" }
];

export default function QuickActions({ onAction }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {ACTIONS.map((action) => (
        <Button
          key={action.label}
          variant="secondary"
          className="w-full justify-start rounded-2xl border-white/15 bg-white/[0.04] px-3 py-2.5 text-left text-xs uppercase tracking-[0.14em] text-slate-200 hover:border-amber-300/35"
          onClick={() => onAction(action.text)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
