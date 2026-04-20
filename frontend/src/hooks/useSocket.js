import { useEffect, useMemo } from "react";
import { io } from "socket.io-client";

export function useSocket() {
  const socket = useMemo(() => {
    const url = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";
    return io(url, { autoConnect: true });
  }, []);

  useEffect(() => {
    return () => socket.close();
  }, [socket]);

  return socket;
}
