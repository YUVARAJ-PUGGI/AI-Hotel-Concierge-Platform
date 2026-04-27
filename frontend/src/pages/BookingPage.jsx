import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import { createBooking } from "../api/bookingApi.js";
import { useAppStore } from "../store/AppStoreContext.jsx";
import Button from "../components/common/Button.jsx";
import Loader from "../components/common/Loader.jsx";
import HotelChatbot from "../components/chat/HotelChatbot.jsx";

function nextDay(days = 1) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function BookingPage() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { state } = useAppStore();
  
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [checkInDate, setCheckInDate] = useState(nextDay(1));
  const [checkOutDate, setCheckOutDate] = useState(nextDay(2));
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showGuestForm, setShowGuestForm] = useState(false);
  
  const [guestForm, setGuestForm] = useState({
    name: state.session.guest?.name || "",
    phone: "",
    govtIdType: "Aadhaar",
    govtIdNumber: ""
  });

  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    async function loadHotelData() {
      setLoading(true);
      try {
        // Load hotel details
        const hotelResponse = await apiRequest(`/hotels/${hotelId}`);
        setHotel(hotelResponse);
        
        // Load all rooms for this hotel
        const roomsResponse = await apiRequest(`/hotels/${hotelId}/rooms`);
        setRooms(roomsResponse);
      } catch (err) {
        setError(`Failed to load hotel data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadHotelData();
  }, [hotelId]);

  async function handleCheckAvailability() {
    if (!checkInDate || !checkOutDate) {
      setError("Please select both check-in and check-out dates");
      return;
    }

    if (new Date(checkInDate) >= new Date(checkOutDate)) {
      setError("Check-out date must be after check-in date");
      return;
    }

    setCheckingAvailability(true);
    setError("");
    
    try {
      const response = await apiRequest(`/hotels/${hotelId}/rooms/availability`, {
        method: "POST",
        body: {
          checkInDate,
          checkOutDate
        }
      });
      
      setRooms(response);
      setSuccess("Availability updated! Available rooms are highlighted.");
    } catch (err) {
      setError(`Failed to check availability: ${err.message}`);
    } finally {
      setCheckingAvailability(false);
    }
  }

  function handleSelectRoom(room) {
    if (!room.isAvailable) {
      setError("This room is not available for the selected dates");
      return;
    }
    setSelectedRoom(room);
    setShowGuestForm(true);
    setError("");
  }

  async function handleBookRoom() {
    if (!selectedRoom || !guestForm.name || !guestForm.phone || !guestForm.govtIdNumber) {
      setError("Please fill in all required fields");
      return;
    }

    setBooking(true);
    setError("");
    
    try {
      const bookingData = await createBooking({
        hotelId,
        roomId: selectedRoom.id,
        checkInDate,
        checkOutDate,
        totalAmount: selectedRoom.price,
        govtIdType: guestForm.govtIdType,
        govtIdNumber: guestForm.govtIdNumber
      }, state.session.guestToken);
      
      navigate(`/confirmation/${bookingData.booking._id}`);
    } catch (err) {
      setError(`Booking failed: ${err.message}`);
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return <Loader rows={6} />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 text-white">
      {/* Hotel Header */}
      <div className="card-glass surface-elevated rounded-[1.75rem] p-6 mb-8">
        <div className="flex items-start gap-6">
          <div
            className="h-32 w-48 rounded-2xl bg-cover bg-center flex-shrink-0"
            style={{ 
              backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.1), rgba(2,6,23,0.8)), url(${hotel?.photoUrl || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80'})` 
            }}
          />
          <div className="flex-1">
            <h1 className="text-3xl font-semibold text-white">{hotel?.name}</h1>
            <p className="text-slate-400 mt-2">{hotel?.locationText}</p>
            <div className="flex items-center gap-4 mt-4">
              <div className="rounded-full bg-amber-300/15 px-3 py-1 text-sm font-semibold text-amber-100">
                {hotel?.rating?.toFixed?.(1) || hotel?.rating} ★
              </div>
              <p className="text-slate-300">Starting from <span className="text-xl font-semibold text-amber-300">₹{hotel?.startingPrice}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Selection */}
      <div className="card-glass surface-elevated rounded-[1.75rem] p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Select Your Dates</h2>
        <div className="grid gap-4 md:grid-cols-4">
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
            <Button
              onClick={handleCheckAvailability}
              disabled={checkingAvailability || !checkInDate || !checkOutDate}
              className="w-full"
            >
              {checkingAvailability ? "Checking..." : "Check Availability"}
            </Button>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center font-semibold text-white transition hover:bg-white/10"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {success}
        </div>
      )}

      {/* Rooms Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rooms.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-400">No rooms available for this hotel yet.</p>
          </div>
        ) : (
          rooms.map((room) => (
            <div
              key={room.id}
              className={`rounded-[1.5rem] border p-6 transition-all cursor-pointer ${
                room.isAvailable === undefined
                  ? "border-white/10 bg-white/5 hover:bg-white/10"
                  : room.isAvailable
                  ? "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
                  : "border-red-500/30 bg-red-500/10 opacity-60"
              }`}
              onClick={() => handleSelectRoom(room)}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">Room {room.roomNumber}</h3>
                  <p className="text-sm text-slate-400">{room.type}</p>
                </div>
                {room.isAvailable !== undefined && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      room.isAvailable
                        ? "bg-emerald-300/15 text-emerald-100"
                        : "bg-red-300/15 text-red-100"
                    }`}
                  >
                    {room.isAvailable ? "Available" : "Booked"}
                  </span>
                )}
              </div>

              <div className="space-y-3 mb-4">
                <p className="text-sm text-slate-300">
                  <span className="text-slate-400">Capacity:</span> {room.capacity} guests
                </p>
                {room.amenities && room.amenities.length > 0 && (
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
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Price per night</p>
                  <p className="text-2xl font-semibold text-amber-300">₹{room.price}</p>
                </div>
                <div className="text-right">
                  {room.isAvailable === false ? (
                    <span className="text-sm text-red-300">Not Available</span>
                  ) : (
                    <span className="text-sm text-emerald-300">
                      {room.isAvailable === undefined ? "Click to select" : "Available"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Guest Form Modal */}
      {showGuestForm && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card-glass surface-elevated rounded-[1.75rem] p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Complete Booking</h2>
              <button
                onClick={() => {
                  setShowGuestForm(false);
                  setSelectedRoom(null);
                }}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 p-4 rounded-2xl border border-white/10 bg-white/5">
              <h3 className="font-semibold text-white">Room {selectedRoom.roomNumber}</h3>
              <p className="text-sm text-slate-400">{selectedRoom.type}</p>
              <p className="text-sm text-slate-300 mt-2">
                {new Date(checkInDate).toLocaleDateString()} - {new Date(checkOutDate).toLocaleDateString()}
              </p>
              <p className="text-lg font-semibold text-amber-300 mt-2">₹{selectedRoom.price} per night</p>
            </div>

            <div className="space-y-4 mb-6">
              <input
                value={guestForm.name}
                onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                placeholder="Full Name"
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
              <input
                value={guestForm.phone}
                onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                placeholder="Phone Number"
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={guestForm.govtIdType}
                  onChange={(e) => setGuestForm({ ...guestForm, govtIdType: e.target.value })}
                  className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
                >
                  <option>Aadhaar</option>
                  <option>Passport</option>
                  <option>Driving License</option>
                  <option>Voter ID</option>
                </select>
                <input
                  value={guestForm.govtIdNumber}
                  onChange={(e) => setGuestForm({ ...guestForm, govtIdNumber: e.target.value })}
                  placeholder="ID Number"
                  className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

            <Button
              onClick={handleBookRoom}
              disabled={booking || !guestForm.name || !guestForm.phone || !guestForm.govtIdNumber}
              className="w-full"
            >
              {booking ? "Booking..." : "Confirm Booking"}
            </Button>
          </div>
        </div>
      )}

      {/* Floating Chatbot Button */}
      <button
        onClick={() => setShowChatbot(true)}
        className="fixed bottom-6 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-amber-300 to-rose-300 text-slate-950 shadow-lg transition-all hover:scale-110 hover:shadow-xl"
        title="Chat with hotel assistant"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {/* Hotel Chatbot */}
      {showChatbot && (
        <HotelChatbot 
          hotelId={hotelId} 
          onClose={() => setShowChatbot(false)} 
        />
      )}
    </div>
  );
}