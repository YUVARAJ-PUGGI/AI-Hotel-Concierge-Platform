import axiosClient, { authHeaders } from "./axiosClient.js";

export async function getTickets(token) {
  const { data } = await axiosClient.get("/staff/tickets", {
    headers: authHeaders(token)
  });
  return data.data;
}

export async function resolveTicket(ticketId, token) {
  const { data } = await axiosClient.patch(`/staff/tickets/${ticketId}/resolve`, {}, {
    headers: authHeaders(token)
  });
  return data.data;
}