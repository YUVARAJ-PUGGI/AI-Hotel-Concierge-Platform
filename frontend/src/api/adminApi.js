import axiosClient, { authHeaders } from "./axiosClient.js";

export async function getAdminHotels(token) {
  const { data } = await axiosClient.get("/admin/hotels", {
    headers: authHeaders(token)
  });
  return data.data;
}

export async function createAdminHotel(token, payload) {
  const { data } = await axiosClient.post("/admin/hotels", payload, {
    headers: authHeaders(token)
  });
  return data.data;
}

export async function getHotelDocuments(token, hotelId) {
  const { data } = await axiosClient.get(`/admin/hotel-documents${hotelId ? `?hotelId=${hotelId}` : ""}`, {
    headers: authHeaders(token)
  });
  return data.data;
}

export async function createHotelDocument(token, payload) {
  const { data } = await axiosClient.post("/admin/hotel-documents", payload, {
    headers: authHeaders(token)
  });
  return data.data;
}

export async function getRooms(token, hotelId) {
  const { data } = await axiosClient.get(`/admin/rooms?hotelId=${hotelId}`, {
    headers: authHeaders(token)
  });
  return data.data;
}

export async function createRoom(token, payload) {
  const { data } = await axiosClient.post("/admin/rooms", payload, {
    headers: authHeaders(token)
  });
  return data.data;
}

export async function deleteRoom(token, roomId) {
  const { data } = await axiosClient.delete(`/admin/rooms/${roomId}`, {
    headers: authHeaders(token)
  });
  return data.data;
}

export async function getHotelBookings(token, hotelId) {
  const { data } = await axiosClient.get(`/admin/bookings?hotelId=${hotelId}`, {
    headers: authHeaders(token)
  });
  return data.data;
}