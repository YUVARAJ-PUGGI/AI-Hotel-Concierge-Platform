import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api",
  timeout: 12000
});

export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default axiosClient;
