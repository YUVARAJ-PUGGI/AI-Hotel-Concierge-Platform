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
      checkInDate: form.checkInDate,
      checkOutDate: form.checkOutDate,
      totalAmount: Number(hotel?.startingPrice || 2500),
      govtIdType: form.govtIdType,
      govtIdNumber: form.govtIdNumber
    }),
    [form.checkInDate, form.checkOutDate, form.govtIdNumber, form.govtIdType, hotel?.startingPrice, hotelId]
  );

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const data = await createBooking(bookingPayload, state.session.guestToken);
      dispatch({ type: "BOOKING_UPDATE", payload: { current: data.booking, confirmation: data } });
      navigate(`/confirmation/${data.booking._id}`);
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
      <GuestForm form={form} onChange={setForm} onSubmit={handleSubmit} loading={submitting} />
    </div>
  );
}
