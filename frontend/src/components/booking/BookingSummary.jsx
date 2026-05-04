import Badge from "../common/Badge.jsx";

export default function BookingSummary({ hotel, selectedRoom }) {
  if (!hotel) return null;

  return (
    <section className="card-glass rounded-3xl p-6 sticky top-24">
      <h2 className="text-xl font-semibold text-white">Hotel Summary</h2>
      <img
        src={hotel.photoUrl}
        alt={hotel.name}
        className="mt-4 h-52 w-full rounded-2xl object-cover"
      />
      <h3 className="mt-4 text-2xl font-semibold text-white">{hotel.name}</h3>
      <p className="mt-1 text-sm text-slate-300">{hotel.locationText}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {(hotel.amenities || []).map((amenity) => (
          <Badge key={amenity}>{amenity}</Badge>
        ))}
      </div>

      {selectedRoom ? (
        <div className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4">
          <p className="text-xs uppercase tracking-wide text-amber-200">Selected Room Price</p>
          <p className="mt-2 text-sm text-white">Room {selectedRoom.roomNumber} - {selectedRoom.type}</p>
          <p className="mt-3 text-2xl font-semibold text-amber-300">Rs. {selectedRoom.price}</p>
          <p className="text-xs text-slate-400 mt-1">per night</p>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Starting Price</p>
          <p className="mt-1 text-2xl font-semibold text-white">Rs. {hotel.startingPrice}</p>
          <p className="text-xs text-slate-400 mt-1">Select a room to see final price</p>
        </div>
      )}
    </section>
  );
}
