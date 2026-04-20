import axiosClient, { authHeaders } from "./axiosClient.js";

export async function getConciergeHistory(bookingId, token) {
  const { data } = await axiosClient.get(`/concierge/history/${bookingId}`, {
    headers: authHeaders(token)
  });
  return data.data;
}

export async function sendConciergeMessage(payload, token) {
  const { data } = await axiosClient.post("/concierge/message", payload, {
    headers: authHeaders(token)
  });
  return data.data;
}
