import Button from "../common/Button.jsx";

export default function InputBox({ value, onChange, onSend, disabled }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1428]/90 p-2 shadow-[0_12px_24px_rgba(2,8,22,0.48)]">
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !disabled) onSend();
          }}
          placeholder={disabled ? "Chat is only available during your stay" : "Order food, request service, or ask hotel details..."}
          disabled={disabled}
          className="flex-1 rounded-xl border border-white/10 bg-[#101a35] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-soft focus:border-amber-300/55 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button onClick={onSend} disabled={disabled} className="rounded-xl px-5 py-3">
          Send
        </Button>
      </div>
      {!disabled ? <p className="px-1 pt-2 text-[11px] text-slate-500">Press Enter to send instantly.</p> : null}
    </div>
  );
}
