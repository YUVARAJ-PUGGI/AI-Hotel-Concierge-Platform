import { Link, NavLink } from "react-router-dom";

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-full px-3.5 py-2 text-sm font-medium transition-soft ${
          isActive
            ? "bg-gradient-to-r from-amber-300 to-rose-300 text-slate-950 shadow-[0_10px_24px_rgba(251,113,133,0.22)]"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link to="/" className="group inline-flex items-center gap-3 text-lg font-semibold tracking-tight text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300 text-slate-950 shadow-lg shadow-amber-500/20 transition-soft group-hover:scale-105">
            H
          </span>
          <span className="leading-none">
            HotelOS
            <span className="mt-1 block text-[11px] font-medium uppercase tracking-[0.35em] text-slate-400">
              Hotel platform
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 shadow-lg shadow-black/15">
          <NavItem to="/" label="Home" />
          <NavItem to="/search" label="Search" />
          <NavItem to="/staff" label="Staff" />
          <NavItem to="/hotels-dashboard" label="Hotels" />
          <NavItem to="/admin" label="Admin" />
        </div>
      </nav>
    </header>
  );
}
