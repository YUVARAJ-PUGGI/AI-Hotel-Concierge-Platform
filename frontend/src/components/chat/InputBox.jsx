import Button from "../common/Button.jsx";

export default function InputBox({ value, onChange, onSend }) {
  return (
    <div className="flex gap-2 border-t border-white/10 pt-3">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onSend();
        }}
        placeholder="Ask about room service, check-in, amenities, local tips..."
        className="flex-1 rounded-xl border border-white/10 bg-[#0f1525] px-4 py-2.5 text-sm text-white placeholder:text-slate-500"
      />
      <Button onClick={onSend}>Send</Button>
    </div>
  );
}
