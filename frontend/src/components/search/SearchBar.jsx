import Button from "../common/Button.jsx";

export default function SearchBar({ value, onChange, onSearch, chips = [] }) {
  return (
    <div className="card-glass surface-elevated rounded-[1.7rem] p-6 md:p-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-100">Hotel search</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-4xl">
          Tell us your ideal stay.
        </h2>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          We translate your intent into the best available hotels instantly.
        </p>
      </div>

      <div className="mx-auto mt-7 max-w-3xl rounded-2xl border border-amber-200/20 bg-slate-950/55 p-3 shadow-sm md:flex md:items-center md:gap-3">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="quiet hotel near metro under 3000 with breakfast"
          className="w-full bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-slate-500"
        />
        <Button className="mt-3 w-full md:mt-0 md:w-auto md:min-w-32" onClick={onSearch}>
          Search
        </Button>
      </div>

      <div className="mx-auto mt-5 flex max-w-3xl flex-wrap justify-center gap-2">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onChange(chip)}
            className="rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1.5 text-xs text-amber-100 transition-soft hover:border-rose-300/40 hover:bg-rose-200/15"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
