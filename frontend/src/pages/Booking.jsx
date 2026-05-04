import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BookingSummary from "../components/booking/BookingSummary.jsx";
import GuestForm from "../components/booking/GuestForm.jsx";
import RoomSelection from "../components/booking/RoomSelection.jsx";
import HotelChatbot from "../components/chat/HotelChatbot.jsx";
import Loader from "../components/common/Loader.jsx";
import { getHotelById } from "../api/hotelApi.js";
import { createBooking } from "../api/bookingApi.js";
import { fetchSession } from "../api/sessionApi.js";
import { useAppStore } from "../store/AppStoreContext.jsx";

function nextDay(days = 1) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function Booking() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useAppStore();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [error, setError] = useState("");
  const [showChatbot, setShowChatbot] = useState(false);
  const [form, setForm] = useState({
    name: state.session.guest?.name || "",
    phone: "",
    govtIdType: "Aadhaar",
    govtIdNumber: "",
    checkInDate: nextDay(1),
    checkOutDate: nextDay(2)
  });

  useEffect(() => {
    async function loadHotel() {
      setLoading(true);
      const data = await getHotelById(hotelId);
      setHotel(data);
      setLoading(false);
    }
    loadHotel();
  }, [hotelId]);

  const bookingPayload = useMemo(
    () => ({
      hotelId,
      roomId: selectedRoom?._id,
      checkInDate: form.checkInDate,
      checkOutDate: form.checkOutDate,
      totalAmount: selectedRoom?.price || Number(hotel?.startingPrice || 2500),
      govtIdType: form.govtIdType,
      govtIdNumber: form.govtIdNumber
    }),
    [form.checkInDate, form.checkOutDate, form.govtIdNumber, form.govtIdType, selectedRoom, hotel?.startingPrice, hotelId]
  );

  async function handleSubmit() {
    if (!selectedRoom) {
      setError("Please select a room to proceed");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      let guestToken = state.session.guestToken;
      if (!guestToken) {
        const guestSession = await fetchSession("guest");
        guestToken = guestSession.token;
      }

      const data = await createBooking(bookingPayload, guestToken);
      dispatch({ type: "BOOKING_UPDATE", payload: { current: data.booking, confirmation: data } });
      navigate(`/confirmation/${data.booking._id}`);
    } catch (err) {
      setError(`Booking failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Loader rows={6} />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      {error && (
        <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-950/20 p-4">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <RoomSelection
            hotelId={hotelId}
            selectedRoomId={selectedRoom?._id}
            onRoomSelect={setSelectedRoom}
            loading={submitting}
          />
          <GuestForm
            form={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            loading={submitting}
            selectedRoom={selectedRoom}
          />
        </div>
        <div className="space-y-6">
          <BookingSummary hotel={hotel} selectedRoom={selectedRoom} />
          <button
            onClick={() => setShowChatbot(true)}
            className="w-full rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-200 hover:bg-amber-300/20 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            Chat with Concierge
          </button>
        </div>
      </div>

      {showChatbot && (
        <HotelChatbot hotelId={hotelId} onClose={() => setShowChatbot(false)} />
      )}
    </div>
  );
}
