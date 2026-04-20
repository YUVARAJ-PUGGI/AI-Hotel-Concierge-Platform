import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Badge from "../components/common/Badge.jsx";
import Button from "../components/common/Button.jsx";
import Loader from "../components/common/Loader.jsx";
import { getHotelById } from "../api/hotelApi.js";

const GALLERY = [
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1631049552240-59c37f38802b?auto=format&fit=crop&w=1400&q=80"
];

export default function HotelDetails() {
  const { hotelId } = useParams();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHotel() {
      setLoading(true);
      const data = await getHotelById(hotelId);
      setHotel(data);
      setLoading(false);
    }
    loadHotel();
  }, [hotelId]);

  if (loading) {
    return <Loader rows={5} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="space-y-6 animate-fade-up">
        <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
          <h1 className="text-3xl font-semibold text-white">{hotel.name}</h1>
          <p className="mt-1 text-slate-300">{hotel.locationText}</p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[hotel.photoUrl, ...GALLERY].map((image, index) => (
              <img key={index} src={image} alt={`${hotel.name} ${index + 1}`} className="h-44 w-full rounded-2xl object-cover" />
            ))}
          </div>
        </div>

        <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
          <h2 className="text-xl font-semibold text-white">Room Types</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-lg font-semibold">Deluxe Double</p>
              <p className="text-sm text-slate-300">AC, Wi-Fi, city view</p>
              <p className="mt-2 text-xl font-bold text-white">Rs. {hotel.startingPrice}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-lg font-semibold">Premium Suite</p>
              <p className="text-sm text-slate-300">Large room, minibar, lounge access</p>
              <p className="mt-2 text-xl font-bold text-white">Rs. {hotel.startingPrice + 1400}</p>
            </div>
          </div>
        </div>

        <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
          <h2 className="text-xl font-semibold text-white">Amenities</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(hotel.amenities || []).map((amenity) => (
              <Badge key={amenity}>{amenity}</Badge>
            ))}
          </div>
        </div>

        <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
          <h2 className="text-xl font-semibold text-white">Policies</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>• Check-in from 2:00 PM</li>
            <li>• Check-out by 11:00 AM</li>
            <li>• Free cancellation up to 24 hours before check-in</li>
          </ul>
        </div>

        <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
          <h2 className="text-xl font-semibold text-white">Map</h2>
          <div className="mt-3 h-56 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            Interactive map placeholder: {hotel.locationText}
          </div>
        </div>

        <div className="card-glass rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-white">Reviews</h2>
          <div className="mt-3 space-y-3 text-sm text-slate-300">
            <p>"Great location and quick check-in process."</p>
            <p>"Concierge support was instant and very accurate."</p>
          </div>
        </div>
      </section>

      <aside className="card-glass surface-elevated sticky top-24 h-fit rounded-[1.75rem] p-6 animate-fade-up">
        <p className="text-sm text-slate-300">Starting from</p>
        <p className="mt-1 text-3xl font-semibold text-white">Rs. {hotel.startingPrice}</p>
        <p className="mt-1 text-sm text-slate-400">Per night + taxes</p>
        <Link to={`/booking/${hotel._id}`} className="mt-5 block">
          <Button className="w-full">Book Now</Button>
        </Link>
      </aside>
    </div>
  );
}
