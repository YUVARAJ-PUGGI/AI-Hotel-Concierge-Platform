import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import Button from "../components/common/Button.jsx";
import { useAppStore } from "../store/AppStoreContext.jsx";

export default function Home() {
  const navigate = useNavigate();
  const { state, dispatch } = useAppStore();

  function handleAuthClick() {
    if (state.session.guestToken) {
      dispatch({ type: "LOGOUT_GUEST" });
    } else {
      navigate("/login/user");
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl flex-col justify-center py-4 md:py-8">
      <section className="space-y-10">
        <div className="premium-panel soft-ring animate-fade-up mx-auto w-full max-w-5xl rounded-[2rem] px-6 py-8 md:px-10 md:py-12">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <div className="inline-flex items-center rounded-full border border-amber-200/30 bg-amber-200/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-100 shadow-sm">
              HotelOS experience
            </div>
            <div className="mt-5 space-y-5">
              <h1 className="premium-title max-w-4xl text-5xl font-semibold leading-[1.05] md:text-7xl">
                Your smart hotel concierge, from booking to check-out.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
                Use role-specific logins to access each dashboard. Guests can discover hotels and manage bookings, staff handle live tickets, and admins manage hotel operations.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button onClick={() => navigate(state.session.guestToken ? "/dashboard" : "/login/user")} className="px-6 py-3 text-base">
                {state.session.guestToken ? "Open User Dashboard" : "User Login"}
              </Button>
              <Button variant="secondary" onClick={handleAuthClick} className="px-6 py-3 text-base">
                {state.session.guestToken ? "Sign Out" : "Sign In"}
              </Button>
              <Link to="/login/staff">
                <Button variant="ghost" className="px-6 py-3 text-base">
                  Staff Login
                </Button>
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-300">
              {[
                "Role-based access",
                "Live operations",
                "Hotel-grounded concierge"
              ].map((item) => (
                <span key={item} className="rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-amber-50">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-5xl gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-slate-900/55 p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-200/80">Guest</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">User Dashboard</h3>
            <p className="mt-2 text-sm text-slate-300">Search hotels, book rooms, and access concierge chat for active stays.</p>
            <Button className="mt-4 w-full" onClick={() => navigate("/login/user")}>Continue as User</Button>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/55 p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-sky-200/80">Staff</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Staff Dashboard</h3>
            <p className="mt-2 text-sm text-slate-300">Monitor real-time escalations and resolve concierge support tickets.</p>
            <Button className="mt-4 w-full" variant="secondary" onClick={() => navigate("/login/staff")}>Continue as Staff</Button>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/55 p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/80">Admin</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Admin Console</h3>
            <p className="mt-2 text-sm text-slate-300">Manage hotels, rooms, and document context powering concierge answers.</p>
            <div className="mt-4 flex flex-col gap-3">
              <Button className="w-full" variant="ghost" onClick={() => navigate("/admin")}>Open Admin Console</Button>
              <Button className="w-full" variant="secondary" onClick={() => navigate("/hotels-dashboard")}>Open Hotels Dashboard</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
