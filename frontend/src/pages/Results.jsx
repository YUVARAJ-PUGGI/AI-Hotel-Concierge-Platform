import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FilterPanel from "../components/search/FilterPanel.jsx";
import HotelList from "../components/search/HotelList.jsx";
import { searchHotels } from "../api/hotelApi.js";
import { useAppStore } from "../store/AppStoreContext.jsx";

function mapWhyPick(hotel) {
  if (hotel.rating >= 4.6) return "Top Rated";
  if (hotel.startingPrice <= 3000) return "Best Value";
  if ((hotel.locationText || "").toLowerCase().includes("metro") || (hotel.locationText || "").toLowerCase().includes("mg road")) return "Closest to metro";
  return "Great Match";
}

function deriveCancellation(hotel) {
  return hotel.rating >= 4.5 ? "Free" : "Non-refundable";
}

export default function Results() {
  const [params] = useSearchParams();
  const initialQuery = params.get("q") || "";
  const { state, dispatch } = useAppStore();
  const [filters, setFilters] = useState({
    maxPrice: 6000,
    amenities: [],
    minRating: 0,
    cancellation: "Any"
  });

  useEffect(() => {
    async function loadResults() {
      dispatch({ type: "SEARCH_UPDATE", payload: { loading: true, error: "" } });
      try {
        const data = await searchHotels({ query: initialQuery, lat: null, lng: null });
        const enriched = data.map((hotel) => ({
          ...hotel,
          whyPick: mapWhyPick(hotel),
          cancellation: deriveCancellation(hotel)
        }));
        dispatch({
          type: "SEARCH_UPDATE",
          payload: {
            query: initialQuery,
            results: enriched,
            loading: false,
            error: ""
          }
        });
      } catch (error) {
        dispatch({
          type: "SEARCH_UPDATE",
          payload: {
            loading: false,
            error: error?.message || "Unable to fetch results"
          }
        });
      }
    }

    loadResults();
  }, [dispatch, initialQuery]);

  const filteredHotels = useMemo(() => {
    return state.search.results.filter((hotel) => {
      if (hotel.startingPrice > filters.maxPrice) return false;
      if (hotel.rating < filters.minRating) return false;
      if (filters.cancellation !== "Any" && hotel.cancellation !== filters.cancellation) return false;
      if (filters.amenities.length) {
        const available = (hotel.amenities || []).map((item) => item.toLowerCase());
        const missing = filters.amenities.some((filterAmenity) => !available.includes(filterAmenity.toLowerCase()));
        if (missing) return false;
      }
      return true;
    });
  }, [filters, state.search.results]);

  return (
    <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
      <FilterPanel filters={filters} onChange={setFilters} />
      <div className="animate-fade-up">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.04] px-4 py-3">
          <h2 className="text-2xl font-semibold text-white">Hotels for "{initialQuery || "your search"}"</h2>
          <p className="text-sm text-slate-300">{filteredHotels.length} results</p>
        </div>

        <HotelList
          hotels={filteredHotels}
          loading={state.search.loading}
          error={state.search.error}
          onReset={() =>
            setFilters({
              maxPrice: 6000,
              amenities: [],
              minRating: 0,
              cancellation: "Any"
            })
          }
        />
      </div>
    </div>
  );
}
