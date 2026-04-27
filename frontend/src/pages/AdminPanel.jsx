import { useEffect, useMemo, useState } from "react";
import { createAdminHotel, getAdminHotels, getHotelDocuments } from "../api/adminApi.js";
import { fetchSession } from "../api/sessionApi.js";
import Button from "../components/common/Button.jsx";
import Badge from "../components/common/Badge.jsx";
import Loader from "../components/common/Loader.jsx";
import { useAppStore } from "../store/AppStoreContext.jsx";

function splitTags(tagString) {
  return tagString
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function AdminPanel() {
  const { state, dispatch } = useAppStore();
  const token = state.session.adminToken;

  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingHotel, setCreatingHotel] = useState(false);
  const [recoveringSession, setRecoveringSession] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hotelForm, setHotelForm] = useState({
    name: "",
    locationText: "",
    description: "",
    startingPrice: "",
    rating: "",
    photoUrl: "",
    amenities: "",
    latitude: "",
    longitude: ""
  });

  const selectedHotel = useMemo(
    () => hotels.find((hotel) => hotel.id === selectedHotelId) || hotels[0] || null,
    [hotels, selectedHotelId]
  );

  useEffect(() => {
    async function bootstrap() {
      if (!token) {
        if (state.session.ready && !recoveringSession) {
          handleRecoverAdminSession();
        }
        return;
      }
      setLoading(true);
      try {
        const hotelList = await getAdminHotels(token);
        setHotels(hotelList);
        const initialHotelId = selectedHotelId || hotelList[0]?.id || "";
        setSelectedHotelId(initialHotelId);
        if (initialHotelId) {
          const docs = await getHotelDocuments(token, initialHotelId);
          setDocuments(docs);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, state.session.ready]);

  useEffect(() => {
    async function loadDocuments() {
      if (!token || !selectedHotelId) return;
      const docs = await getHotelDocuments(token, selectedHotelId);
      setDocuments(docs);
    }

    loadDocuments();
  }, [selectedHotelId, token]);

  async function handleCreateHotel() {
    if (!token) return;

    setCreatingHotel(true);
    setError("");
    setSuccess("");

    try {
      const created = await createAdminHotel(token, {
        ...hotelForm,
        amenities: splitTags(hotelForm.amenities)
      });

      const hotelList = await getAdminHotels(token);
      setHotels(hotelList);
      setSelectedHotelId(created.id);
      setHotelForm({
        name: "",
        locationText: "",
        description: "",
        startingPrice: "",
        rating: "",
        photoUrl: "",
        amenities: "",
        latitude: "",
        longitude: ""
      });
      setSuccess("Hotel created successfully. You can manage it from the Hotels dashboard.");
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingHotel(false);
    }
  }

  async function handleRecoverAdminSession() {
    setRecoveringSession(true);
    setError("");
    setSuccess("");

    try {
      const admin = await fetchSession("admin");
      dispatch({
        type: "LOGIN_ADMIN",
        payload: {
          token: admin.token,
          user: admin.user
        }
      });
      setSuccess("Admin session recovered. You can now manage hotels and documents.");
    } catch (err) {
      setError(err.message || "Unable to recover admin session");
    } finally {
      setRecoveringSession(false);
    }
  }

  if (!state.session.ready) {
    return <Loader rows={5} />;
  }

  if (!token) {
    return (
      <section className="mx-auto max-w-2xl card-glass surface-elevated rounded-[1.75rem] p-6 text-center">
        <p className="text-xs uppercase tracking-[0.32em] text-amber-100">Admin access</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Admin session is not available</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          We could not load the admin token. This usually happens when backend session bootstrap fails.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button onClick={handleRecoverAdminSession} disabled={recoveringSession}>
            {recoveringSession ? "Recovering..." : "Recover Admin Session"}
          </Button>
        </div>
        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      </section>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <aside className="card-glass surface-elevated rounded-[1.75rem] p-5">
        <p className="text-xs uppercase tracking-[0.32em] text-amber-100">Admin console</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Hotel Management</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Create and manage hotels. View indexed documents that the concierge uses to answer guest questions.
        </p>

        <div className="mt-5 space-y-3">
          {hotels.map((hotel) => (
            <button
              key={hotel.id}
              type="button"
              onClick={() => setSelectedHotelId(hotel.id)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition-soft ${
                selectedHotelId === hotel.id
                  ? "border-amber-200/25 bg-amber-200/10 text-white"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <p className="font-semibold">{hotel.name}</p>
              <p className="mt-1 text-xs text-slate-400">{hotel.locationText}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          <p className="font-semibold text-white">Selected hotel</p>
          <p className="mt-2">{selectedHotel?.name || "No hotel selected"}</p>
        </div>
      </aside>

      <section className="space-y-6">
        {error && (
          <div className="card-glass surface-elevated rounded-[1.75rem] p-4 text-sm text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="card-glass surface-elevated rounded-[1.75rem] p-4 text-sm text-emerald-300">
            {success}
          </div>
        )}

        <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
          <h2 className="text-xl font-semibold text-white">Add new hotel</h2>
          <p className="mt-2 text-sm text-slate-300">
            Create a hotel first, then upload hotel-specific documents so concierge answers are grounded.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <input
              value={hotelForm.name}
              onChange={(event) => setHotelForm({ ...hotelForm, name: event.target.value })}
              placeholder="Hotel name"
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
            <input
              value={hotelForm.locationText}
              onChange={(event) => setHotelForm({ ...hotelForm, locationText: event.target.value })}
              placeholder="Location text"
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
            <input
              value={hotelForm.startingPrice}
              onChange={(event) => setHotelForm({ ...hotelForm, startingPrice: event.target.value })}
              placeholder="Starting price (e.g. 3200)"
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
            <input
              value={hotelForm.rating}
              onChange={(event) => setHotelForm({ ...hotelForm, rating: event.target.value })}
              placeholder="Rating (e.g. 4.5)"
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
            <input
              value={hotelForm.latitude}
              onChange={(event) => setHotelForm({ ...hotelForm, latitude: event.target.value })}
              placeholder="Latitude (optional)"
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
            <input
              value={hotelForm.longitude}
              onChange={(event) => setHotelForm({ ...hotelForm, longitude: event.target.value })}
              placeholder="Longitude (optional)"
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
            <input
              value={hotelForm.photoUrl}
              onChange={(event) => setHotelForm({ ...hotelForm, photoUrl: event.target.value })}
              placeholder="Photo URL"
              className="md:col-span-2 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
            <input
              value={hotelForm.amenities}
              onChange={(event) => setHotelForm({ ...hotelForm, amenities: event.target.value })}
              placeholder="Amenities (comma-separated)"
              className="md:col-span-2 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
            <textarea
              value={hotelForm.description}
              onChange={(event) => setHotelForm({ ...hotelForm, description: event.target.value })}
              rows={3}
              placeholder="Short description"
              className="md:col-span-2 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={handleCreateHotel} disabled={creatingHotel || !hotelForm.name || !hotelForm.locationText}>
              {creatingHotel ? "Creating..." : "Create hotel"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Documents", value: documents.length },
            { label: "Hotel", value: selectedHotel?.name || "—" },
            { label: "Chat context", value: "Live" }
          ].map((item) => (
            <div key={item.label} className="card-glass surface-elevated rounded-[1.35rem] p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{item.label}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
          <h2 className="text-xl font-semibold text-white">Indexed knowledge</h2>
          <p className="mt-2 text-sm text-slate-300">These documents are passed into the concierge AI for hotel-specific answers.</p>

          <div className="mt-5 space-y-3">
            {documents.map((document) => (
              <article key={document._id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{document.title}</h3>
                    <p className="text-xs text-slate-400">{document.sourceName}</p>
                  </div>
                  <Badge tone="accent">{new Date(document.createdAt).toLocaleDateString()}</Badge>
                </div>
                <p className="mt-3 max-h-28 overflow-hidden text-sm leading-7 text-slate-300">{document.content}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(document.tags || []).map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </article>
            ))}

            {!loading && documents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-slate-400">
                No documents uploaded yet. Use the Hotel Management page to upload documents.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}