import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import Button from "../components/common/Button.jsx";
import { loginUser, registerUser } from "../api/authApi.js";
import { fetchSession } from "../api/sessionApi.js";
import { useAppStore } from "../store/AppStoreContext.jsx";

function normalizeRole(roleParam) {
  if (roleParam === "staff") return "staff";
  if (roleParam === "admin") return "admin";
  return "user";
}

function matchesRole(expectedRole, actualRole) {
  if (expectedRole === "user") return actualRole === "guest";
  if (expectedRole === "admin") return actualRole === "admin";
  return ["front_desk", "housekeeper", "manager", "staff"].includes(actualRole);
}

export default function Login() {
  const { role } = useParams();
  const loginType = normalizeRole(role);
  const isRoleRegisterAllowed = loginType === "user";

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { dispatch } = useAppStore();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let data;
      if (isRegister) {
        if (!isRoleRegisterAllowed) {
          throw new Error("Only user accounts can be created from this login screen.");
        }
        data = await registerUser(name, email, password);
      } else {
        data = await loginUser(email, password);
      }

      if (!matchesRole(loginType, data.user?.role)) {
        throw new Error(
          loginType === "admin"
            ? "This account is not an admin account."
            : loginType === "staff"
            ? "This account is not a staff account."
            : "Please use a guest account for user login."
        );
      }

      dispatch({
        type: loginType === "staff" ? "LOGIN_STAFF" : loginType === "admin" ? "LOGIN_ADMIN" : "LOGIN_GUEST",
        payload: {
          token: data.token,
          user: data.user
        }
      });

      navigate(loginType === "staff" ? "/staff" : loginType === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setError("");
    setLoading(true);

    try {
      const sessionRole = loginType === "user" ? "guest" : loginType;
      const data = await fetchSession(sessionRole);

      dispatch({
        type: loginType === "staff" ? "LOGIN_STAFF" : loginType === "admin" ? "LOGIN_ADMIN" : "LOGIN_GUEST",
        payload: {
          token: data.token,
          user: data.user
        }
      });

      navigate(loginType === "staff" ? "/staff" : loginType === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || "Could not start a demo session.");
    } finally {
      setLoading(false);
    }
  }

  const title = loginType === "admin" ? "Admin Login" : loginType === "staff" ? "Staff Login" : isRegister ? "Create FindHotel Account" : "FindHotel Login";
  const subtitle =
    loginType === "admin"
      ? "Sign in with your admin account to manage hotels and operations."
      : loginType === "staff"
      ? "Sign in with your staff account to manage live guest requests."
      : isRegister
      ? "Create your guest account to book stays and use concierge chat."
      : "Sign in to find hotels, manage bookings, and chat with concierge.";

  return (
    <div className="flex min-h-[calc(100vh-8rem)] w-full items-center justify-center p-4">
      <div className="card-glass w-full max-w-md animate-fade-up rounded-[2rem] p-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-white">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {subtitle}
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {isRegister && (
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0f1525] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#00D1B2] focus:outline-none focus:ring-1 focus:ring-[#00D1B2]"
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0f1525] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#00D1B2] focus:outline-none focus:ring-1 focus:ring-[#00D1B2]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0f1525] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#00D1B2] focus:outline-none focus:ring-1 focus:ring-[#00D1B2]"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full py-3" disabled={loading}>
              {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
            </Button>
          </div>
        </form>

        <div className="mt-4">
          <Button type="button" variant="secondary" className="w-full py-3" disabled={loading} onClick={handleDemoLogin}>
            {loading ? "Starting demo..." : `Continue with Demo ${loginType === "user" ? "FindHotel" : loginType === "staff" ? "Staff" : "Admin"}`}
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-slate-400">
          {isRoleRegisterAllowed ? (
            <>
              {isRegister ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError("");
                }}
                className="text-[#00D1B2] hover:underline"
              >
                {isRegister ? "Sign In" : "Create one"}
              </button>
            </>
          ) : (
            <span>Need a guest account? Use the user login page.</span>
          )}
        </div>
      </div>
    </div>
  );
}
