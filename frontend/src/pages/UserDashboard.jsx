import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getUserBookings } from "../api/bookingApi.js";
import { useAppStore } from "../store/AppStoreContext.jsx";
import Button from "../components/common/Button.jsx";
import Badge from "../components/common/Badge.jsx";
import Loader from "../components/common/Loader.jsx";

export default function UserDashboard() {
  const { state, dispatch } = useAppStore();
  const navigate = useNavigate();
  const token = state.session.guestToken;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    async function fetchBookings() {
      try {
        const data = await getUserBookings(token);
        setBookings(data);
      } catch (err) {
        setError(err.message || "Failed to load your bookings.");
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, [token, navigate]);

  const handleSignOut = () => {
    dispatch({ type: "LOGOUT_GUEST" });
    navigate("/login");
  };

  if (!state.session.ready || loading) {
    return <Loader rows={5} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-8 px-4">
      {/* Header Section */}
      <div className="card-glass surface-elevated rounded-[2rem] p-8 text-center animate-fade-up relative">
        <div className="absolute top-8 right-8">
          <Button variant="secondary" onClick={handleSignOut} className="border border-red-500/20 text-red-400 hover:bg-red-500/10">
            Sign Out
          </Button>
        </div>
        <h1 className="text-4xl font-semibold text-white">Welcome, {state.session.guest?.name || "Guest"}!</h1>
        <p className="mt-4 text-slate-300">
          Ready for your next stay? Search for hotels or manage your current bookings below.
        </p>
        <div className="mt-6 flex justify-center">
          <Button onClick={() => navigate("/search")}>Find Hotels</Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Bookings Section */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-6">My Bookings</h2>
        
        {bookings.length === 0 ? (
          <div className="card-glass surface-elevated rounded-[1.75rem] p-8 text-center">
            <p className="text-slate-400">You don't have any bookings yet.</p>
            <Button variant="secondary" onClick={() => navigate("/search")} className="mt-4">
              Start Exploring
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => {
              const isCheckedIn = booking.status === "checked_in";
              
              return (
                <div key={booking._id} className="card-glass surface-elevated rounded-[1.75rem] p-6 flex flex-col h-full animate-fade-up">
                  {/* Hotel Image / Info */}
                  {booking.hotelId?.photoUrl && (
                    <div className="mb-4 h-40 w-full overflow-hidden rounded-2xl">
                      <img 
                        src={booking.hotelId.photoUrl} 
                        alt={booking.hotelId.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-white">{booking.hotelId?.name || "Unknown Hotel"}</h3>
                      <Badge 
                        className={
                          booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300' :
                          booking.status === 'checked_in' ? 'bg-blue-500/20 text-blue-300' :
                          booking.status === 'checked_out' ? 'bg-gray-500/20 text-gray-300' :
                          booking.status === 'cancelled' ? 'bg-red-500/20 text-red-300' :
                          'bg-yellow-500/20 text-yellow-300'
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-slate-400 mb-4">{booking.hotelId?.locationText}</p>
                    
                    <div className="space-y-2 text-sm text-slate-300">
                      <p><span className="text-slate-500">Room:</span> {booking.roomId?.roomNumber || "N/A"} ({booking.roomId?.type || "Standard"})</p>
                      <p><span className="text-slate-500">Check-in:</span> {new Date(booking.checkInDate).toLocaleDateString()}</p>
                      <p><span className="text-slate-500">Check-out:</span> {new Date(booking.checkOutDate).toLocaleDateString()}</p>
                      <p><span className="text-slate-500">Amount:</span> ₹{booking.totalAmount}</p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-white/10">
                    {isCheckedIn ? (
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 border-none shadow-[0_0_20px_rgba(59,130,246,0.5)]" 
                        onClick={() => navigate(`/concierge/${booking._id}`)}
                      >
                        ✨ Chat with Concierge
                      </Button>
                    ) : (
                      <Button variant="secondary" className="w-full cursor-not-allowed opacity-50" disabled>
                        Concierge Available at Check-in
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
