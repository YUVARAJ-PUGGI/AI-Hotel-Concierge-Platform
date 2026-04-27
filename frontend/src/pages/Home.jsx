import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useState } from "react";
import SearchBar from "../components/search/SearchBar.jsx";
import Button from "../components/common/Button.jsx";
import { useAppStore } from "../store/AppStoreContext.jsx";

const CHIPS = [
  "Budget hotel near metro under 3000",
  "Couple-friendly with free cancellation",
  "Business hotel with strong Wi-Fi",
  "Luxury stay with pool and breakfast"
];

export default function Home() {
  const navigate = useNavigate();
  const { state, dispatch } = useAppStore();
  const [query, setQuery] = useState(state.search.query || "quiet hotel near metro under 3000 with breakfast");

  function onSearch() {
    if (!state.session.guestToken) {
      navigate("/login");
      return;
    }
    dispatch({ type: "SEARCH_UPDATE", payload: { query } });
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  function handleAuthClick() {
    if (state.session.guestToken) {
      dispatch({ type: "LOGOUT_GUEST" });
    } else {
      navigate("/login");
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl flex-col justify-center py-4 md:py-8">
      <section className="space-y-12">
        <div className="premium-panel soft-ring animate-fade-up mx-auto w-full max-w-5xl rounded-[2rem] px-6 py-8 md:px-10 md:py-12">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <div className="inline-flex items-center rounded-full border border-amber-200/30 bg-amber-200/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-100 shadow-sm">
              HotelOS experience
            </div>
            <div className="mt-5 space-y-5">
              <h1 className="premium-title max-w-4xl text-5xl font-semibold leading-[1.05] md:text-7xl">
                Beautiful stays, booked with confidence.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
                Discover hotels in natural language, move through a polished booking flow, and unlock concierge support personalized to your selected property.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button onClick={onSearch} className="px-6 py-3 text-base">
                Find Hotels
              </Button>
              <Button variant="secondary" onClick={handleAuthClick} className="px-6 py-3 text-base">
                {state.session.guestToken ? "Sign Out" : "Sign In"}
              </Button>
              <Link to="/admin">
                <Button variant="secondary" className="px-6 py-3 text-base">
                  Admin Console
                </Button>
              </Link>
              <Link to="/staff">
                <Button variant="ghost" className="px-6 py-3 text-base">
                  Staff Dashboard
                </Button>
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-300">
              {[
                "Conversational search",
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

        <div className="mx-auto max-w-4xl space-y-4">
          <SearchBar value={query} onChange={setQuery} onSearch={onSearch} chips={CHIPS} />
          <div className="rounded-2xl border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-center text-sm text-amber-50 md:text-base">
            Natural language search • Luxury booking flow • Chat that uses hotel docs
          </div>
        </div>
      </section>
    </div>
  );
}
