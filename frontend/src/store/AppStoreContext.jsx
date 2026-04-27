import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const AppStoreContext = createContext(null);

const initialState = {
  session: {
    ready: false,
    guestToken: "",
    staffToken: "",
    adminToken: "",
    guest: null,
    staff: null,
    admin: null
  },
  search: {
    query: "",
    results: [],
    loading: false,
    error: ""
  },
  booking: {
    current: null,
    confirmation: null
  },
  chat: {
    messages: [],
    typing: false
  }
};

function reducer(state, action) {
  switch (action.type) {
    case "SESSION_READY":
      return {
        ...state,
        session: {
          ...state.session,
          ready: true,
          guestToken: action.payload.guestToken,
          staffToken: action.payload.staffToken,
          adminToken: action.payload.adminToken,
          guest: action.payload.guest,
          staff: action.payload.staff,
          admin: action.payload.admin
        }
      };
    case "LOGIN_GUEST":
      localStorage.setItem("guestToken", action.payload.token);
      return {
        ...state,
        session: {
          ...state.session,
          guestToken: action.payload.token,
          guest: action.payload.user
        }
      };
    case "LOGIN_STAFF":
      localStorage.setItem("staffToken", action.payload.token);
      return {
        ...state,
        session: {
          ...state.session,
          staffToken: action.payload.token,
          staff: action.payload.user
        }
      };
    case "LOGIN_ADMIN":
      localStorage.setItem("adminToken", action.payload.token);
      return {
        ...state,
        session: {
          ...state.session,
          adminToken: action.payload.token,
          admin: action.payload.user
        }
      };
    case "LOGOUT_GUEST":
      localStorage.removeItem("guestToken");
      return {
        ...state,
        session: {
          ...state.session,
          guestToken: "",
          guest: null
        }
      };
    case "SEARCH_UPDATE":
      return {
        ...state,
        search: {
          ...state.search,
          ...action.payload
        }
      };
    case "BOOKING_UPDATE":
      return {
        ...state,
        booking: {
          ...state.booking,
          ...action.payload
        }
      };
    case "CHAT_SET":
      return {
        ...state,
        chat: {
          ...state.chat,
          ...action.payload
        }
      };
    default:
      return state;
  }
}

export function AppStoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    async function bootstrapSession() {
      try {
        let guestUser = null;
        const savedGuestToken = localStorage.getItem("guestToken");
        const savedStaffToken = localStorage.getItem("staffToken");
        const savedAdminToken = localStorage.getItem("adminToken");
        if (savedGuestToken) {
          try {
            const payload = JSON.parse(atob(savedGuestToken.split('.')[1]));
            guestUser = payload;
          } catch (e) {
            localStorage.removeItem("guestToken");
          }
        }

        let staffUser = null;
        if (savedStaffToken) {
          try {
            staffUser = JSON.parse(atob(savedStaffToken.split('.')[1]));
          } catch (e) {
            localStorage.removeItem("staffToken");
          }
        }

        let adminUser = null;
        if (savedAdminToken) {
          try {
            adminUser = JSON.parse(atob(savedAdminToken.split('.')[1]));
          } catch (e) {
            localStorage.removeItem("adminToken");
          }
        }

        dispatch({
          type: "SESSION_READY",
          payload: {
            guestToken: savedGuestToken || "",
            staffToken: savedStaffToken || "",
            adminToken: savedAdminToken || "",
            guest: guestUser,
            staff: staffUser,
            admin: adminUser
          }
        });
      } catch {
        dispatch({
          type: "SESSION_READY",
          payload: {
            guestToken: "",
            staffToken: "",
            adminToken: "",
            guest: null,
            staff: null,
            admin: null
          }
        });
      }
    }

    bootstrapSession();
  }, []);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error("useAppStore must be used inside AppStoreProvider");
  }
  return context;
}