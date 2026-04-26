import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BookingSummary from "../components/booking/BookingSummary.jsx";
import GuestForm from "../components/booking/GuestForm.jsx";
import Loader from "../components/common/Loader.jsx";
import { getHotelById } from "../api/hotelApi.js";
import { createBooking } from "../api/bookingApi.js";
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
  const [error, setError] = useState("");
  
  // Get room ID and dates from URL query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const roomId = searchParams.get('roomId');
  const urlCheckIn = searchParams.get('checkIn');
  const urlCheckOut = searchParams.get('checkOut');
  
  const [form, setForm] = useState({
    name: state.session.guest?.name || "",
    phone: "",
    govtIdType: "Aadhaar",
    govtIdNumber: "",
    checkInDate: urlCheckIn || nextDay(1),
    checkOutDate: urlCheckOut || nextDay(2)
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
      roomId: roomId, // Add room ID to payload
      checkInDate: form.checkInDate,
      checkOutDate: form.checkOutDate,
      totalAmount: Number(hotel?.startingPrice || 2500),
      govtIdType: form.govtIdType,
      govtIdNumber: form.govtIdNumber
    }),
    [form.checkInDate, form.checkOutDate, form.govtIdNumber, form.govtIdType, hotel?.startingPrice, hotelId, roomId]
  );

  async function handleSubmit() {
    // Validate form
    if (!form.name || !form.phone || !form.govtIdNumber) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    setError("");
    
    try {
      console.log("Creating booking with payload:", bookingPayload);
      console.log("Guest token:", state.session.guestToken);
      
      const data = await createBooking(bookingPayload, state.session.guestToken);
      console.log("Booking created:", data);
      
      dispatch({ type: "BOOKING_UPDATE", payload: { current: data.booking, confirmation: data } });
      navigate(`/confirmation/${data.booking._id}`);
    } catch (err) {
      console.error("Booking error:", err);
      setError(err.response?.data?.error?.message || err.message || "Failed to create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Loader rows={6} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <BookingSummary hotel={hotel} />
      <div>
        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}
        <GuestForm form={form} onChange={setForm} onSubmit={handleSubmit} loading={submitting} />
      </div>
    </div>
  );
}
