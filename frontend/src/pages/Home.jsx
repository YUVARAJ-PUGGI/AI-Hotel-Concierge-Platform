import { Link, useNavigate } from "react-router-dom";
import Button from "../components/common/Button.jsx";
import { useAppStore } from "../store/AppStoreContext.jsx";

const featureCards = [
  {
    title: "Find hotels faster",
    text: "Search by budget, amenities, location, and travel intent, then move straight into room selection.",
    accent: "from-amber-300/30 to-orange-400/10"
  },
  {
    title: "Concierge that knows the hotel",
    text: "Guests get answers grounded in hotel documents, policies, menus, and service availability.",
    accent: "from-teal-300/25 to-emerald-400/10"
  },
  {
    title: "Human handoff when needed",
    text: "Low-confidence questions and service requests become staff tickets with live operational context.",
    accent: "from-rose-300/25 to-fuchsia-400/10"
  }
];

const workflow = [
  "Search and compare hotels",
  "Book a room and confirm stay",
  "Ask concierge during the visit",
  "Escalate requests to staff in real time"
];

const roleLinks = [
  {
    label: "FindHotel",
    title: "Guest booking hub",
    text: "Discover hotels, view bookings, and open concierge chat after check-in.",
    to: "/login/user",
    action: "Start finding hotels"
  },
  {
    label: "Staff",
    title: "Live support desk",
    text: "Track guest messages, prioritize tickets, and resolve room service or support requests.",
    to: "/login/staff",
    action: "Open staff login"
  },
  {
    label: "Admin",
    title: "Hotel operations control",
    text: "Manage hotels, rooms, staff, and documents that power guarded AI responses.",
    to: "/login/admin",
    action: "Open admin login"
  }
];

export default function Home() {
  const navigate = useNavigate();
  const { state } = useAppStore();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-16 px-4 py-8 md:px-6 md:py-12">
      <section className="relative min-h-[calc(100vh-10rem)] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/45 px-5 py-8 shadow-2xl shadow-black/25 backdrop-blur-xl md:px-10">
        <div className="hero-motion-grid" aria-hidden="true">
          <span className="motion-ribbon ribbon-1" />
          <span className="motion-ribbon ribbon-2" />
          <span className="motion-ribbon ribbon-3" />
        </div>

        <div className="relative z-10 grid min-h-[calc(100vh-16rem)] items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl animate-fade-up">
            <p className="inline-flex rounded-full border border-amber-200/25 bg-amber-200/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-100">
              HotelOS concierge platform
            </p>
            <h1 className="premium-title mt-6 text-5xl font-semibold leading-[1.03] md:text-7xl">
              Find, book, and get help from one hotel command center.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              A modern guest experience for hotel discovery, booking confirmation, AI concierge support, and real-time staff escalation.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => navigate(state.session.guestToken ? "/dashboard" : "/login/user")} className="px-6 py-3 text-base">
                Open FindHotel
              </Button>
              <Link to="/login/staff">
                <Button variant="secondary" className="px-6 py-3 text-base">
                  Staff access
                </Button>
              </Link>
              <Link to="/login/admin">
                <Button variant="ghost" className="px-6 py-3 text-base">
                  Admin access
                </Button>
              </Link>
            </div>

            <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                ["24/7", "Concierge logic"],
                ["Live", "Ticket events"],
                ["Hotel", "Grounded answers"]
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-2xl font-semibold text-white">{value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="relative mx-auto max-w-xl rounded-[1.75rem] border border-amber-200/20 bg-slate-950/70 p-4 shadow-2xl shadow-amber-950/20">
              <div className="overflow-hidden rounded-[1.35rem] border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&w=1300&q=85"
                  alt="Hotel lobby with reception desk"
                  className="h-[24rem] w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-slate-950/90 p-4 shadow-xl shadow-black/30 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-amber-100">Guest request</p>
                    <p className="mt-1 text-sm text-slate-200">Extra towels and late checkout question</p>
                  </div>
                  <span className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-950">Routed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {featureCards.map((feature, index) => (
          <article
            key={feature.title}
            className="surface-elevated animate-fade-up rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <div className={`h-1.5 w-20 rounded-full bg-gradient-to-r ${feature.accent}`} />
            <h2 className="mt-5 text-2xl font-semibold text-white">{feature.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{feature.text}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="card-glass rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-100">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">A single flow from search to service recovery.</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Guests stay in one journey while the backend coordinates bookings, guarded concierge answers, Socket.IO events, and staff tickets.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {workflow.map((item, index) => (
            <div key={item} className="rounded-[1.35rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-amber-100">0{index + 1}</p>
              <p className="mt-3 text-lg font-semibold text-white">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-100">Choose your workspace</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Every role lands in the right page.</h2>
          </div>
          <Link to="/hotels-dashboard" className="text-sm font-semibold text-amber-100 hover:text-amber-50">
            Browse hotel dashboard
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {roleLinks.map((role) => (
            <article key={role.label} className="surface-elevated rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{role.label}</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">{role.title}</h3>
              <p className="mt-3 min-h-20 text-sm leading-7 text-slate-300">{role.text}</p>
              <Button className="mt-5 w-full" variant={role.label === "FindHotel" ? "primary" : "secondary"} onClick={() => navigate(role.to)}>
                {role.action}
              </Button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
