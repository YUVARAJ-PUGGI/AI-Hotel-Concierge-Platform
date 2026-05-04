import { useEffect, useState } from "react";
import { getHotelRooms } from "../../api/bookingApi.js";
import Loader from "../common/Loader.jsx";
import Badge from "../common/Badge.jsx";

export default function RoomSelection({ hotelId, selectedRoomId, onRoomSelect, loading: externalLoading }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hotelId) return;

    async function loadRooms() {
      setLoading(true);
      setError("");
      try {
        const data = await getHotelRooms(hotelId);
        setRooms(data);
      } catch (err) {
        setError("Failed to load available rooms");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadRooms();
  }, [hotelId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Select a Room</h3>
        <Loader rows={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-white/10 bg-red-950/30 p-4">
        <p className="text-sm text-red-200">{error}</p>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center">
        <p className="text-sm text-slate-400">No rooms available for these dates</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Select a Room</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {rooms.map((room) => (
          <button
            key={room._id}
            onClick={() => onRoomSelect(room)}
            disabled={externalLoading}
            className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
              selectedRoomId === room._id
                ? "border-amber-300 bg-amber-300/10"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-semibold text-white">
                  Room {room.roomNumber} - {room.type}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Floor {room.floor} • Capacity: {room.maxOccupancy} guests
                </p>
                {room.amenities && room.amenities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {room.amenities.slice(0, 3).map((amenity) => (
                      <Badge key={amenity} tone="neutral">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-amber-300">Rs. {room.price}</p>
                <p className="text-xs text-slate-400 mt-1">per night</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
