import Button from "../common/Button.jsx";

export default function GuestForm({ form, onChange, onSubmit, loading, selectedRoom }) {
  return (
    <section className="card-glass rounded-3xl p-6">
      <h2 className="text-xl font-semibold text-white">Guest Details</h2>

      <div className="mt-4 grid gap-3">
        <input
          value={form.name}
          onChange={(event) => onChange({ ...form, name: event.target.value })}
          placeholder="Full name"
          className="rounded-xl border border-white/10 bg-[#0f1525] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
        />
        <input
          value={form.phone}
          onChange={(event) => onChange({ ...form, phone: event.target.value })}
          placeholder="Phone number"
          className="rounded-xl border border-white/10 bg-[#0f1525] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
        />
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={form.govtIdType}
            onChange={(event) => onChange({ ...form, govtIdType: event.target.value })}
            className="rounded-xl border border-white/10 bg-[#0f1525] px-3 py-2.5 text-sm text-white"
          >
            <option>Aadhaar</option>
            <option>Passport</option>
            <option>Driving License</option>
            <option>Voter ID</option>
          </select>
          <input
            value={form.govtIdNumber}
            onChange={(event) => onChange({ ...form, govtIdNumber: event.target.value })}
            placeholder="Government ID number"
            className="rounded-xl border border-white/10 bg-[#0f1525] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="date"
            value={form.checkInDate}
            onChange={(event) => onChange({ ...form, checkInDate: event.target.value })}
            className="rounded-xl border border-white/10 bg-[#0f1525] px-3 py-2.5 text-sm text-white"
          />
          <input
            type="date"
            value={form.checkOutDate}
            onChange={(event) => onChange({ ...form, checkOutDate: event.target.value })}
            className="rounded-xl border border-white/10 bg-[#0f1525] px-3 py-2.5 text-sm text-white"
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">Payment (mock)</p>
        <p className="mt-1 text-sm text-slate-300">UPI / Card / Net banking UI placeholder with secure tokenization in production.</p>
      </div>

      {selectedRoom && (
        <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4">
          <p className="text-xs uppercase tracking-wide text-amber-200">Room Selected</p>
          <p className="mt-2 text-sm text-white">Room {selectedRoom.roomNumber} - {selectedRoom.type} at Rs. {selectedRoom.price}/night</p>
        </div>
      )}

      <Button className="mt-5 w-full" onClick={onSubmit} disabled={loading || !selectedRoom}>
        {loading ? "Confirming..." : "Confirm Booking"}
      </Button>
    </section>
  );
}
