import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

async function fetchSession(role) {
  const response = await fetch(`http://localhost:4000/api/dev/session?role=${role}`);
  const data = await response.json();
  return data.data;
}

export function AuthProvider({ children }) {
  const [guestToken, setGuestToken] = useState("");
  const [staffToken, setStaffToken] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([fetchSession("guest"), fetchSession("front_desk")])
      .then(([guestSession, staffSession]) => {
        setGuestToken(guestSession.token);
        setStaffToken(staffSession.token);
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo(
    () => ({
      ready,
      guestToken,
      staffToken,
      getToken(role = "guest") {
        return role === "front_desk" ? staffToken : guestToken;
      }
    }),
    [ready, guestToken, staffToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}