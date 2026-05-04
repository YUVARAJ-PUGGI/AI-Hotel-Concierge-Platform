import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Button from "../components/common/Button.jsx";
import { useAppStore } from "../store/AppStoreContext.jsx";
import { fetchSession } from "../api/sessionApi.js";
import { getBookingById } from "../api/bookingApi.js";

export default function Confirmation() {
  const { bookingId } = useParams();
  const { state, dispatch } = useAppStore();
  const [booking, setBooking] = useState(state.booking.current || null);
  const [loadingBooking, setLoadingBooking] = useState(true);

  const canUseConcierge = useMemo(() => booking?.status === "checked_in", [booking?.status]);

  useEffect(() => {
    async function loadBooking() {
      setLoadingBooking(true);
      try {
        let guestToken = state.session.guestToken;
        if (!guestToken) {
          const guestSession = await fetchSession("guest");
          guestToken = guestSession.token;
          dispatch({ type: "LOGIN_GUEST", payload: { token: guestToken, user: guestSession.user } });
        }

        const bookingData = await getBookingById(bookingId, guestToken);
        setBooking(bookingData);
      } catch {
        setBooking(state.booking.current || null);
      } finally {
        setLoadingBooking(false);
      }
    }

    loadBooking();
  }, [bookingId, dispatch, state.booking.current, state.session.guestToken]);

  return (
    <section className="mx-auto max-w-3xl card-glass rounded-3xl p-8 text-center">
      <p className="text-sm uppercase tracking-[0.24em] text-[#71f7e6]">Booking Confirmed</p>
      <h1 className="mt-3 text-4xl font-semibold text-white">Your stay is secured</h1>
      <p className="mt-3 text-slate-300">Booking ID: {bookingId}</p>

      <div className="mt-6 grid gap-3 text-left md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Check-in Instructions</p>
          <p className="mt-2 text-sm text-slate-300">Show your government ID at reception and use your booking ID for quick check-in.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Room</p>
          <p className="mt-2 text-sm text-slate-300">Assigned at check-in. Concierge can assist with room requests instantly.</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
        {canUseConcierge ? (
          <Link to={`/concierge/${bookingId}`}>
            <Button>Start Concierge</Button>
          </Link>
        ) : (
          <Button disabled>{loadingBooking ? "Checking access..." : "Concierge unlocks after hotel check-in"}</Button>
        )}
        <Link to="/results">
          <Button variant="secondary">Back to Results</Button>
        </Link>
      </div>

      {!canUseConcierge && !loadingBooking ? (
        <p className="mt-3 text-xs text-slate-400">
          Concierge chat becomes available once hotel staff marks your booking as checked-in.
        </p>
      ) : null}

      {booking ? (
        <p className="mt-4 text-xs text-slate-500">
          Confirmed for hotel: {booking?.hotelId?.name || String(booking?.hotelId?._id || booking.hotelId)}
        </p>
      ) : null}
    </section>
  );
}
