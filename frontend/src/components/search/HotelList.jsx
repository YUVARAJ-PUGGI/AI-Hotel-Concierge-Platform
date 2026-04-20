import EmptyState from "../common/EmptyState.jsx";
import Loader from "../common/Loader.jsx";
import HotelCard from "./HotelCard.jsx";

export default function HotelList({ hotels, loading, error, onReset }) {
  if (loading) {
    return <Loader rows={4} />;
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load hotels"
        description={error}
      />
    );
  }

  if (!hotels.length) {
    return (
      <EmptyState
        title="No hotels matched your filters"
        description="Try increasing your budget or removing a few amenities to discover more options."
        action={
          <button type="button" onClick={onReset} className="rounded-xl bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition-soft hover:-translate-y-0.5">
            Reset filters
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {hotels.map((hotel) => (
        <HotelCard key={hotel.id} hotel={hotel} />
      ))}
    </div>
  );
}
