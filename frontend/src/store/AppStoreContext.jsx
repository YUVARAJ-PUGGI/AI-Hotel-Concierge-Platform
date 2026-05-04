import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { fetchSession } from "../api/sessionApi.js";

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
        const [guest, staff, admin] = await Promise.all([
          fetchSession("guest"),
          fetchSession("front_desk"),
          fetchSession("admin")
        ]);

        dispatch({
          type: "SESSION_READY",
          payload: {
            guestToken: guest.token,
            staffToken: staff.token,
            adminToken: admin.token,
            guest: guest.user,
            staff: staff.user,
            admin: admin.user
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