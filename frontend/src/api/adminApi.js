import axiosClient, { authHeaders } from "./axiosClient.js";

export async function getAdminHotels(token) {
  const { data } = await axiosClient.get("/admin/hotels", {
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