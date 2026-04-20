import Badge from "../common/Badge.jsx";

const AMENITIES = ["Wi-Fi", "Pool", "Breakfast", "AC"];
const CANCELLATION = ["Any", "Free", "Non-refundable"];

export default function FilterPanel({ filters, onChange }) {
  function toggleAmenity(amenity) {
    const exists = filters.amenities.includes(amenity);
    const amenities = exists
      ? filters.amenities.filter((item) => item !== amenity)
      : [...filters.amenities, amenity];
    onChange({ ...filters, amenities });
  }

  return (
    <aside className="card-glass surface-elevated sticky top-24 rounded-[1.75rem] p-5">
      <h3 className="text-lg font-semibold text-white">Filters</h3>

      <div className="mt-5">
        <label className="text-xs uppercase tracking-wide text-slate-400">Max Price (INR)</label>
        <input
          type="range"
          min="1500"
          max="12000"
          step="100"
          value={filters.maxPrice}
          onChange={(event) => onChange({ ...filters, maxPrice: Number(event.target.value) })}
          className="mt-2 w-full accent-amber-300"
        />
        <p className="mt-1 text-sm text-slate-200">Up to Rs. {filters.maxPrice}</p>
      </div>

      <div className="mt-5">
        <label className="text-xs uppercase tracking-wide text-slate-400">Minimum Rating</label>
        <select
          value={filters.minRating}
          onChange={(event) => onChange({ ...filters, minRating: Number(event.target.value) })}
          className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition-soft focus:border-amber-200/35 focus:ring-2 focus:ring-amber-200/10"
        >
          <option value={0}>Any rating</option>
          <option value={3.5}>3.5+</option>
          <option value={4}>4+</option>
          <option value={4.5}>4.5+</option>
        </select>
      </div>

      <div className="mt-5">
        <label className="text-xs uppercase tracking-wide text-slate-400">Amenities</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {AMENITIES.map((amenity) => (
            <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)}>
              <Badge tone={filters.amenities.includes(amenity) ? "accent" : "neutral"}>{amenity}</Badge>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <label className="text-xs uppercase tracking-wide text-slate-400">Cancellation</label>
        <div className="mt-2 space-y-2">
          {CANCELLATION.map((option) => (
            <label key={option} className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-sm text-slate-300 transition-soft hover:border-amber-200/20 hover:bg-white/[0.06]">
              <input
                type="radio"
                name="cancellation"
                checked={filters.cancellation === option}
                onChange={() => onChange({ ...filters, cancellation: option })}
                className="accent-amber-300"
              />
              {option}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
