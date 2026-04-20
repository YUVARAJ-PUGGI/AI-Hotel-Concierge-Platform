import Button from "../common/Button.jsx";

const ACTIONS = [
  { label: "Order food", text: "I want to order room service." },
  { label: "Request towel", text: "Please send 2 extra towels to my room." },
  { label: "Late checkout", text: "Can I get late checkout?" }
];

export default function QuickActions({ onAction }) {
  return (
    <div className="space-y-2">
      {ACTIONS.map((action) => (
        <Button key={action.label} variant="secondary" className="w-full justify-start text-left" onClick={() => onAction(action.text)}>
          {action.label}
        </Button>
      ))}
    </div>
  );
}
