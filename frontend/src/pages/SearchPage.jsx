import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import { getAdminHotels } from "../api/adminApi.js";
import { useAppStore } from "../store/AppStoreContext.jsx";

const QUICK_FILTERS = ["Breakfast", "Pool", "Wi-Fi", "Late Checkout", "Room Service"];

function getUserCoords() {
  if (typeof window === "undefined" || !window.navigator?.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 2500 }
    );
  });
}

function formatDistance(distanceMeters) {
  if (!Number.isFinite(distanceMeters)) return null;
  if (distanceMeters < 1000) return `${distanceMeters} m`;
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export default function SearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state } = useAppStore();
  const token = state.session.adminToken;
  const initialQuery = params.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [hotels, setHotels] = useState([]);
  const [allHotels, setAllHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedHotelForBooking, setSelectedHotelForBooking] = useState(null);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [availableRooms, setAvailableRooms] = useState([]);

  async function loadAllHotels() {
    setLoading(true);
    setError("");

    try {
      if (!token) {
        setError("Loading hotels...");
        setLoading(false);
        return;
      }

      // Fetch all registered hotels directly from admin API
      const data = await getAdminHotels(token);
      console.log("Loaded hotels:", data);
      
      // Add readyRooms property (set to 0 for now)
      const hotelsWithRooms = data.map(hotel => ({
        ...hotel,
        readyRooms: 0,
        amenities: hotel.amenities || []
      }));
      
      setAllHotels(hotelsWithRooms);
      setHotels(hotelsWithRooms);
    } catch (err) {
      console.error("Error loading hotels:", err);
      setError(`Failed to load hotels: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadHotels(searchText = query) {
    if (!searchText || searchText.trim() === "") {
      // If no search query, show all hotels
      setHotels(allHotels);
      return;
    }

    // Filter hotels by search query
    const searchLower = searchText.toLowerCase();
    const filtered = allHotels.filter(hotel => 
      hotel.name.toLowerCase().includes(searchLower) ||
      hotel.locationText.toLowerCase().includes(searchLower) ||
      (hotel.amenities && hotel.amenities.some(a => a.toLowerCase().includes(searchLower)))
    );
    
    setHotels(filtered);
  }

  function handleBookRoom(hotel) {
    setSelectedHotelForBooking(hotel);
    setCheckInDate("");
    setCheckOutDate("");
    setAvailableRooms([]);
  }

  async function handleCheckAvailability() {
    if (!checkInDate || !checkOutDate) {
      setError("Please select both check-in and check-out dates");
      return;
    }

    setError("");
    
    try {
      console.log("Checking availability for hotel:", selectedHotelForBooking.id);
      console.log("Dates:", { checkInDate, checkOutDate });
      
      // Check room availability for specific dates
      const response = await apiRequest(`/hotels/${selectedHotelForBooking.id}/rooms/availability`, {
        method: "POST",
        body: {
          checkInDate,
          checkOutDate
        }
      });
      
      console.log("Fetched rooms with availability:", response);
      console.log("Room details:");
      response.forEach(room => {
        console.log(`Room ${room.roomNumber}:`, {
          status: room.status,
          isAvailable: room.isAvailable,
          price: room.price,
          capacity: room.capacity
        });
      });
      
      if (!response || response.length === 0) {
        setError("No rooms available for this hotel yet. Please contact the hotel.");
        setAvailableRooms([]);
        return;
      }

      setAvailableRooms(response);
    } catch (err) {
      console.error("Error checking availability:", err);
      console.error("Error details:", err.response?.data);
      setError(`Failed to check availability: ${err.response?.data?.error?.message || err.message}`);
      setAvailableRooms([]);
    }
  }

  function handleBookNow(room) {
    // Navigate to booking page with room details
    navigate(`/booking/${selectedHotelForBooking.id}?roomId=${room.id}&checkIn=${checkInDate}&checkOut=${checkOutDate}`);
  }

  useEffect(() => {
    loadAllHotels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const visibleHotels = useMemo(() => hotels, [hotels]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-white">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl md:p-8">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-200/80">Hotel discovery</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-6xl">
            Find nearby hotels with a modern concierge experience
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-300 md:text-lg">
            Search in natural language, compare smartly, and book into a hotel-specific concierge chat.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadHotels(query)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-base text-white outline-none placeholder:text-slate-500"
              placeholder="Search by hotel name, location, or amenities..."
            />
            <button
              type="button"
              onClick={() => loadHotels(query)}
              className="rounded-2xl bg-gradient-to-r from-amber-300 to-rose-300 px-6 py-4 font-semibold text-slate-950 transition hover:from-amber-200 hover:to-rose-200"
            >
              Search
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {QUICK_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  const newQuery = filter.toLowerCase();
                  setQuery(newQuery);
                  loadHotels(newQuery);
                }}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              >
                {filter}
              </button>
            ))}
          </div>

          {!loading && allHotels.length > 0 && (
            <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <p className="text-sm text-emerald-200">
                ✓ Showing {hotels.length} of {allHotels.length} registered hotels
                {query && ` matching "${query}"`}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-100">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-64 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5" />
              ))}
            </div>
          ) : null}

          {!loading && visibleHotels.length === 0 ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
              <p className="text-slate-300 text-center">
                {allHotels.length === 0 
                  ? "No hotels registered yet. Please add hotels from the Admin panel."
                  : "No hotels match your search. Try a different query or clear the search to see all hotels."}
              </p>
              {allHotels.length > 0 && query && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      setQuery("");
                      setHotels(allHotels);
                    }}
                    className="rounded-2xl bg-gradient-to-r from-amber-300 to-rose-300 px-6 py-3 font-semibold text-slate-950 transition hover:from-amber-200 hover:to-rose-200"
                  >
                    Show All Hotels
                  </button>
                </div>
              )}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {visibleHotels.map((hotel) => (
              <article key={hotel.id} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900/80 shadow-xl shadow-black/30">
                <div
                  className="h-40 bg-cover bg-center"
                  style={{ backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.1), rgba(2,6,23,0.8)), url(${hotel.photoUrl || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80'})` }}
                />
                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-white">{hotel.name}</h2>
                      <p className="mt-1 text-sm text-slate-400">{hotel.locationText}</p>
                    </div>
                    <div className="rounded-full bg-amber-300/15 px-3 py-1 text-sm font-semibold text-amber-100">
                      {hotel.rating?.toFixed?.(1) || hotel.rating} ★
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(hotel.amenities || []).map((amenity) => (
                      <span key={amenity} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                        {amenity}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <div>
                      <p className="text-slate-400">Starting from</p>
                      <p className="text-lg font-semibold text-white">₹{hotel.startingPrice}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400">Rooms ready</p>
                      <p className="text-lg font-semibold text-white">{hotel.readyRooms}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      to={`/hotels/${hotel.id}`}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center font-semibold text-white transition hover:bg-white/10"
                    >
                      View details
                    </Link>
                    <button
                      onClick={() => handleBookRoom(hotel)}
                      className="flex-1 rounded-2xl bg-gradient-to-r from-amber-300 to-rose-300 px-4 py-3 text-center font-semibold text-slate-950 transition hover:from-amber-200 hover:to-rose-200"
                    >
                      Book Room
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-200/80">Why it feels premium</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>• Natural-language hotel search</li>
            <li>• Visually rich hotel cards</li>
            <li>• Booking links directly from search</li>
            <li>• Smart concierge chat after booking</li>
          </ul>
        </aside>
      </section>

      {/* Booking Modal */}
      {selectedHotelForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card-glass surface-elevated rounded-[1.75rem] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Book Room - {selectedHotelForBooking.name}
                </h2>
                <p className="text-sm text-slate-400 mt-1">{selectedHotelForBooking.locationText}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedHotelForBooking(null);
                  setAvailableRooms([]);
                  setCheckInDate("");
                  setCheckOutDate("");
                }}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Date Selection */}
            <div className="card-glass surface-elevated rounded-[1.5rem] p-5 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Select Your Dates</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Check-in Date</label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Check-out Date</label>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={checkInDate || new Date().toISOString().split('T')[0]}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleCheckAvailability}
                    disabled={!checkInDate || !checkOutDate}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-300 to-rose-300 px-4 py-3 font-semibold text-slate-950 transition hover:from-amber-200 hover:to-rose-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Check Availability
                  </button>
                </div>
              </div>
            </div>

            {/* Available Rooms */}
            {availableRooms.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Available Rooms</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {availableRooms.map((room) => (
                    <div
                      key={room.id}
                      className={`rounded-[1.5rem] border p-5 transition-soft ${
                        room.isAvailable
                          ? "border-white/10 bg-white/5"
                          : "border-red-500/30 bg-red-500/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-white">Room {room.roomNumber}</h4>
                          <p className="text-sm text-slate-400">{room.type}</p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            room.isAvailable
                              ? "bg-emerald-300/15 text-emerald-100"
                              : "bg-red-300/15 text-red-100"
                          }`}
                        >
                          {room.isAvailable ? "Available" : "Booked"}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-slate-300">
                          <span className="text-slate-400">Capacity:</span> {room.capacity} guests
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {room.amenities.map((amenity, idx) => (
                            <span
                              key={idx}
                              className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400">Price per night</p>
                          <p className="text-xl font-semibold text-amber-300">₹{room.price}</p>
                        </div>
                        {room.isAvailable ? (
                          <button
                            onClick={() => handleBookNow(room)}
                            className="rounded-xl bg-gradient-to-r from-amber-300 to-rose-300 px-4 py-2 font-semibold text-slate-950 transition hover:from-amber-200 hover:to-rose-200"
                          >
                            Book Now
                          </button>
                        ) : (
                          <button
                            disabled
                            className="rounded-xl bg-slate-700 px-4 py-2 font-semibold text-slate-400 cursor-not-allowed"
                          >
                            Not Available
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {availableRooms.length === 0 && checkInDate && checkOutDate && (
              <div className="text-center py-8 text-slate-400">
                Click "Check Availability" to see available rooms for your selected dates.
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}