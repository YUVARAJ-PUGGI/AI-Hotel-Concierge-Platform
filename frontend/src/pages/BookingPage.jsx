import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function BookingPage() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { getToken, ready } = useAuth();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    checkInDate: "",
    checkOutDate: "",
    totalAmount: "",
    govtIdType: "Aadhaar",
    govtIdNumber: ""
  });

  useEffect(() => {
    async function loadHotel() {
      setLoading(true);
      try {
        const data = await apiRequest(`/hotels/${hotelId}`);
        setHotel(data);
        setForm((prev) => ({
          ...prev,
          totalAmount: String(data.startingPrice || 2500)
        }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadHotel();
  }, [hotelId]);

  async function handleBook() {
    setSubmitting(true);
    setError("");

    try {
      const token = getToken("guest");
      const data = await apiRequest("/bookings", {
        method: "POST",
        token,
        body: {
          hotelId,
          checkInDate: form.checkInDate,
          checkOutDate: form.checkOutDate,
          totalAmount: Number(form.totalAmount),
          govtIdType: form.govtIdType,
          govtIdNumber: form.govtIdNumber
        }
      });

      navigate(`/chat/${data.booking._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return <main className="mx-auto max-w-5xl px-4 py-10 text-slate-200">Loading secure session...</main>;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-white">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-amber-200/80">Booking + ID verification</p>
          <h1 className="mt-3 text-4xl font-semibold">Reserve your room</h1>
        </div>
        <Link to="/" className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 hover:bg-white/5">
          Back to search
        </Link>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5" />
      ) : null}

      {!loading && hotel ? (
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 backdrop-blur-xl">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-slate-300">Check-in date</span>
                <input
                  type="date"
                  value={form.checkInDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, checkInDate: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm text-slate-300">Check-out date</span>
                <input
                  type="date"
                  value={form.checkOutDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, checkOutDate: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm text-slate-300">Government ID type</span>
                <select
                  value={form.govtIdType}
                  onChange={(e) => setForm((prev) => ({ ...prev, govtIdType: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
                >
                  <option>Aadhaar</option>
                  <option>Passport</option>
                  <option>Driving License</option>
                  <option>Voter ID</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm text-slate-300">ID number</span>
                <input
                  value={form.govtIdNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, govtIdNumber: e.target.value }))}
                  placeholder="XXXX-XXXX-1234"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm text-slate-300">Total amount</span>
                <input
                  type="number"
                  value={form.totalAmount}
                  onChange={(e) => setForm((prev) => ({ ...prev, totalAmount: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleBook}
              disabled={submitting}
              className="mt-6 rounded-2xl bg-gradient-to-r from-amber-300 to-rose-300 px-6 py-4 font-semibold text-slate-950 transition hover:from-amber-200 hover:to-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Booking..." : "Confirm booking"}
            </button>

            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
          </div>

          <aside className="h-fit rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-6">
            <div
              className="h-44 rounded-[1rem] bg-cover bg-center"
              style={{ backgroundImage: `url(${hotel.photoUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'})` }}
            />
            <h2 className="mt-4 text-2xl font-semibold">{hotel.name}</h2>
            <p className="mt-1 text-slate-400">{hotel.locationText}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(hotel.amenities || []).map((amenity) => (
                <span key={amenity} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                  {amenity}
                </span>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-slate-400">Starting from</p>
                <p className="text-lg font-semibold text-white">₹{hotel.startingPrice}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-slate-400">Rooms ready</p>
                <p className="text-lg font-semibold text-white">{hotel.readyRooms}</p>
              </div>
            </div>
          </aside>
        </section>
      ) : null}
    </main>
  );
}