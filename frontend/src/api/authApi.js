import axiosClient from "./axiosClient.js";

export async function loginUser(email, password) {
  const { data } = await axiosClient.post("/auth/login", { email, password });
  return data.data; // { token, user }
}

export async function registerUser(name, email, password) {
  const { data } = await axiosClient.post("/auth/register", { name, email, password });
  return data.data; // { token, user }
}
