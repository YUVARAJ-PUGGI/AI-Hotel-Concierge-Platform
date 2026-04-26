import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminHotels } from "../api/adminApi.js";
import Badge from "../components/common/Badge.jsx";
import Button from "../components/common/Button.jsx";
import Loader from "../components/common/Loader.jsx";
import { useAppStore } from "../store/AppStoreContext.jsx";

export default function HotelsDashboard() {
  const { state } = useAppStore();
  const navigate = useNavigate();
  const token = state.session.adminToken;

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedHotel, setSelectedHotel] = useState(null);

  useEffect(() => {
    async function loadHotels() {
      if (!token) return;
      setLoading(true);
      try {
        const hotelList = await getAdminHotels(token);
        setHotels(hotelList);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadHotels();
  }, [token]);

  if (!state.session.ready) {
    return <Loader rows={5} />;
  }

  if (!token) {
    return (
      <section className="mx-auto max-w-2xl card-glass surface-elevated rounded-[1.75rem] p-6 text-center">
        <p className="text-xs uppercase tracking-[0.32em] text-amber-100">Admin access</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Admin session is not available</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          You need admin access to view registered hotels.
        </p>
      </section>
    );
  }

  if (loading) {
    return <Loader rows={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
        <p className="text-xs uppercase tracking-[0.32em] text-amber-100">Hotels Dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Registered Hotels</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          View all admin-registered hotels in the platform. Click on any hotel to see detailed information.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-glass surface-elevated rounded-[1.35rem] p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Total Hotels</p>
          <p className="mt-3 text-2xl font-semibold text-white">{hotels.length}</p>
        </div>
        <div className="card-glass surface-elevated rounded-[1.35rem] p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Average Rating</p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {hotels.length > 0
              ? (hotels.reduce((sum, h) => sum + (parseFloat(h.rating) || 0), 0) / hotels.length).toFixed(1)
              : "—"}
          </p>
        </div>
        <div className="card-glass surface-elevated rounded-[1.35rem] p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Status</p>
          <p className="mt-3 text-2xl font-semibold text-white">Active</p>
        </div>
      </div>

      {error && (
        <div className="card-glass surface-elevated rounded-[1.75rem] p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Hotels Grid */}
      {hotels.length === 0 ? (
        <div className="card-glass surface-elevated rounded-[1.75rem] p-8 text-center">
          <p className="text-slate-400">No hotels registered yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {hotels.map((hotel) => (
            <article
              key={hotel.id}
              className="card-glass surface-elevated rounded-[1.75rem] p-6 transition-soft hover:scale-[1.02] cursor-pointer"
              onClick={() => setSelectedHotel(selectedHotel?.id === hotel.id ? null : hotel)}
            >
              {/* Hotel Image */}
              {hotel.photoUrl && (
                <div className="relative h-48 w-full overflow-hidden rounded-2xl">
                  <img
                    src={hotel.photoUrl}
                    alt={hotel.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Hotel Info */}
              <div className={hotel.photoUrl ? "mt-5" : ""}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold text-white">{hotel.name}</h2>
                    <p className="mt-1 text-sm text-slate-400">{hotel.locationText}</p>
                  </div>
                  {hotel.rating && (
                    <Badge tone="accent">
                      ⭐ {hotel.rating}
                    </Badge>
                  )}
                </div>

                {hotel.description && (
                  <p className="mt-4 text-sm leading-7 text-slate-300">{hotel.description}</p>
                )}

                {/* Price */}
                {hotel.startingPrice && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs uppercase tracking-[0.28em] text-slate-400">Starting from</span>
                    <span className="text-xl font-semibold text-amber-300">₹{hotel.startingPrice}</span>
                    <span className="text-sm text-slate-400">per night</span>
                  </div>
                )}

                {/* Amenities */}
                {hotel.amenities && hotel.amenities.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400 mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {hotel.amenities.slice(0, 5).map((amenity, idx) => (
                        <Badge key={idx}>{amenity}</Badge>
                      ))}
                      {hotel.amenities.length > 5 && (
                        <Badge>+{hotel.amenities.length - 5} more</Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                {selectedHotel?.id === hotel.id && (
                  <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Hotel ID</p>
                      <p className="mt-1 text-sm text-white font-mono">{hotel.id}</p>
                    </div>
                    {hotel.latitude && hotel.longitude && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Coordinates</p>
                        <p className="mt-1 text-sm text-white">
                          {hotel.latitude}, {hotel.longitude}
                        </p>
                      </div>
                    )}
                    {hotel.amenities && hotel.amenities.length > 5 && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">All Amenities</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {hotel.amenities.map((amenity, idx) => (
                            <Badge key={idx}>{amenity}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <div className="mt-5">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/hotel-management/${hotel.id}`);
                    }}
                  >
                    Manage Hotel
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
