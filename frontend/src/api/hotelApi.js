import axiosClient from "./axiosClient.js";

export async function searchHotels(payload) {
  const { data } = await axiosClient.post("/hotels/search", payload);
  return data.data;
}

export async function getHotelById(hotelId) {
  const { data } = await axiosClient.get(`/hotels/${hotelId}`);
  return data.data;
}
