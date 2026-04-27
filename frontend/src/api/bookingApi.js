import axiosClient, { authHeaders } from "./axiosClient.js";

export async function createBooking(payload, token) {
  const { data } = await axiosClient.post("/bookings", payload, {
    headers: authHeaders(token)
  });
  return data.data;
}

export async function getBookingById(bookingId, token) {
  const { data } = await axiosClient.get(`/bookings/${bookingId}`, {
    headers: authHeaders(token)
  });
  return data.data;
}

export async function getUserBookings(token) {
  const { data } = await axiosClient.get("/bookings", {
    headers: authHeaders(token)
  });
  return data.data;
}
