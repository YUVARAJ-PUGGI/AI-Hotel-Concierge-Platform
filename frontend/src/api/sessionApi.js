import axiosClient from "./axiosClient.js";

export async function fetchSession(role = "guest") {
  const { data } = await axiosClient.get(`/dev/session?role=${role}`);
  return data.data;
}
