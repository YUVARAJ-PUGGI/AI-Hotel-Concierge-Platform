import { useEffect, useMemo, useState } from "react";
import { createHotelDocument, getAdminHotels, getHotelDocuments } from "../api/adminApi.js";
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
  const { state } = useAppStore();
  const token = state.session.adminToken;

  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    title: "",
    sourceName: "manual upload",
    tags: "",
    content: ""
  });

  const selectedHotel = useMemo(
    () => hotels.find((hotel) => hotel.id === selectedHotelId) || hotels[0] || null,
    [hotels, selectedHotelId]
  );

  useEffect(() => {
    async function bootstrap() {
      if (!token) return;
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
  }, [token]);

  useEffect(() => {
    async function loadDocuments() {
      if (!token || !selectedHotelId) return;
      const docs = await getHotelDocuments(token, selectedHotelId);
      setDocuments(docs);
    }

    loadDocuments();
  }, [selectedHotelId, token]);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setForm((prev) => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^.]+$/, ""),
      sourceName: file.name,
      content: text
    }));
  }

  async function handleSubmit() {
    if (!token || !selectedHotelId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await createHotelDocument(token, {
        hotelId: selectedHotelId,
        title: form.title,
        sourceName: form.sourceName,
        tags: splitTags(form.tags),
        content: form.content
      });

      setSuccess("Hotel document uploaded and indexed for concierge answers.");
      setForm({ title: "", sourceName: "manual upload", tags: "", content: "" });
      const docs = await getHotelDocuments(token, selectedHotelId);
      setDocuments(docs);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!token) {
    return <Loader rows={5} />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <aside className="card-glass surface-elevated rounded-[1.75rem] p-5">
        <p className="text-xs uppercase tracking-[0.32em] text-amber-100">Admin console</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Hotel knowledge center</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Upload hotel documents, policies, FAQs, and service notes. The concierge will use these details to answer guest questions.
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

        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
            <h2 className="text-xl font-semibold text-white">Upload hotel document</h2>
            <p className="mt-2 text-sm text-slate-300">
              Upload a .txt or .md document, or paste structured hotel notes, policies, and service details.
            </p>

            <div className="mt-5 grid gap-4">
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Document title"
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
              <input
                value={form.sourceName}
                onChange={(event) => setForm({ ...form, sourceName: event.target.value })}
                placeholder="Source name"
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
              <input
                value={form.tags}
                onChange={(event) => setForm({ ...form, tags: event.target.value })}
                placeholder="Tags separated by commas, e.g. check-in, policies, wifi"
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
              <textarea
                value={form.content}
                onChange={(event) => setForm({ ...form, content: event.target.value })}
                rows={10}
                placeholder="Paste hotel policy details, amenities, timings, or service instructions here."
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
              <label className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-4 text-sm text-slate-300 transition-soft hover:bg-white/[0.08]">
                <span className="block text-white">Attach a text file</span>
                <span className="mt-1 block text-xs text-slate-400">The browser will read the file contents and place them into the document body.</span>
                <input type="file" accept=".txt,.md,.json,.csv,text/plain" className="mt-3 block w-full text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-amber-300 file:px-4 file:py-2 file:font-semibold file:text-slate-950" onChange={handleFileChange} />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={handleSubmit} disabled={saving || !selectedHotelId}>
                {saving ? "Uploading..." : "Upload document"}
              </Button>
            </div>

            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
            {success ? <p className="mt-4 text-sm text-emerald-300">{success}</p> : null}
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
                  Upload the first hotel document to start enriching chatbot answers.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}