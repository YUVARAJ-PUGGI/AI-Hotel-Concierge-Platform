import { Link } from "react-router-dom";
import Badge from "../common/Badge.jsx";
import Button from "../common/Button.jsx";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

export default function HotelCard({ hotel }) {
  return (
    <article className="card-glass surface-elevated group overflow-hidden rounded-[1.75rem] p-4 md:p-5">
      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        <div className="relative overflow-hidden rounded-2xl">
          <img
            src={hotel.photoUrl || FALLBACK_IMAGE}
            alt={hotel.name}
            className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-white md:text-2xl">{hotel.name}</h3>
                <p className="mt-1 text-sm text-slate-300">{hotel.locationText}</p>
              </div>
              <Badge tone="accent">{hotel.rating?.toFixed?.(1) ?? hotel.rating} ★</Badge>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {(hotel.amenities || []).map((amenity) => (
                <Badge key={amenity}>{amenity}</Badge>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Price / night</p>
                <p className="mt-1 text-lg font-semibold text-white">Rs. {hotel.startingPrice}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Distance</p>
                <p className="mt-1 text-lg font-semibold text-white">{hotel.distance || "2.1 km"}</p>
              </div>
            </div>

            <div className="mt-3 inline-flex items-center rounded-xl border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-xs font-semibold text-amber-100">
              Why this hotel: {hotel.whyPick || "Best Value"}
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Link to={`/hotels/${hotel.id}`} className="flex-1">
              <Button variant="secondary" className="w-full">View Details</Button>
            </Link>
            <Link to={`/booking/${hotel.id}`} className="flex-1">
              <Button className="w-full">Book Now</Button>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
