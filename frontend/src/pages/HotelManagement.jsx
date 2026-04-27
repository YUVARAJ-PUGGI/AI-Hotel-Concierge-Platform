import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAdminHotels, getHotelDocuments, createHotelDocument, getRooms, createRoom, deleteRoom, getHotelBookings, deleteHotelDocument, updateBookingStatus, getHotelStaff, addHotelStaff, removeHotelStaff } from "../api/adminApi.js";
import StaffManagement from "../components/staff/StaffManagement.jsx";
import Badge from "../components/common/Badge.jsx";
import Button from "../components/common/Button.jsx";
import Loader from "../components/common/Loader.jsx";
import { useAppStore } from "../store/AppStoreContext.jsx";

function splitTags(tagString) {
  return tagString
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function HotelManagement() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { state } = useAppStore();
  const token = state.session.adminToken;

  const [hotel, setHotel] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [documentForm, setDocumentForm] = useState({
    title: "",
    sourceName: "manual upload",
    tags: "",
    content: ""
  });

  // Rooms state
  const [rooms, setRooms] = useState([]);
  const [roomForm, setRoomForm] = useState({
    roomNumber: "",
    type: "",
    price: "",
    status: "available",
    capacity: ""
  });
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [roomBookings, setRoomBookings] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    checkIn: "",
    checkOut: "",
    numberOfGuests: ""
  });

  // Services state
  const [services, setServices] = useState([]);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price: "",
    category: ""
  });

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Staff state
  const [staff, setStaff] = useState([]);
  const [staffForm, setStaffForm] = useState({
    name: "",
    role: "front_desk",
    email: "",
    phone: "",
    password: ""
  });

  useEffect(() => {
    async function loadHotelData() {
      if (!token || !hotelId) return;
      setLoading(true);
      try {
        const hotels = await getAdminHotels(token);
        const currentHotel = hotels.find((h) => h.id === hotelId);
        if (!currentHotel) {
          setError("Hotel not found");
          return;
        }
        setHotel(currentHotel);

        // Load documents
        const docs = await getHotelDocuments(token, hotelId);
        setDocuments(docs);

        // Load rooms from database
        const roomsData = await getRooms(token, hotelId);
        setRooms(roomsData.map(room => ({
          ...room,
          id: room._id,
          bookings: [] // Bookings will be loaded separately when needed
        })));

        // Load staff and services
        const staffData = await getHotelStaff(token, hotelId);
        setStaff(staffData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadHotelData();
  }, [token, hotelId]);

  async function loadBookings() {
    if (!token || !hotelId) return;
    setLoadingBookings(true);
    try {
      const bookingsData = await getHotelBookings(token, hotelId);
      setBookings(bookingsData);
    } catch (err) {
      setError(`Failed to load bookings: ${err.message}`);
    } finally {
      setLoadingBookings(false);
    }
  }

  // Load bookings when bookings tab is selected
  useEffect(() => {
    if (activeTab === "bookings") {
      loadBookings();
    }
  }, [activeTab, token, hotelId]);

  async function handleAddStaff() {
    if (!staffForm.name || !staffForm.role || !staffForm.email || !staffForm.password) {
      setError("Please fill in all required staff fields");
      return;
    }
    
    setSaving(true);
    setError("");
    
    try {
      const newStaff = await addHotelStaff(token, hotelId, staffForm);
      setStaff([...staff, newStaff]);
      setStaffForm({ name: "", role: "front_desk", email: "", phone: "", password: "" });
      setSuccess("Staff member added successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveStaff(staffId) {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    setSaving(true);
    setError("");
    
    try {
      await removeHotelStaff(token, hotelId, staffId);
      setStaff(staff.filter((s) => s.staffId !== staffId));
      setSuccess("Staff member removed successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleAddService() {
    if (!serviceForm.name || !serviceForm.price) return;
    setServices([...services, { ...serviceForm, id: Date.now() }]);
    setServiceForm({ name: "", description: "", price: "", category: "" });
    setSuccess("Service added successfully.");
  }

  function handleRemoveService(id) {
    setServices(services.filter((s) => s.id !== id));
    setSuccess("Service removed.");
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file type
    const fileType = file.type;
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown"
    ];

    if (!validTypes.includes(fileType)) {
      setError("Please upload a valid document file (PDF, DOC, DOCX, TXT, or MD)");
      return;
    }

    let content = "";
    
    try {
      if (fileType === "application/pdf") {
        // For PDF files, we'll provide a template that the user can edit
        // In a production system, you'd use a PDF parsing library
        content = `Hotel Services & Menu

Room Services:
- 24/7 Room Service
- Laundry Service
- Free Wi-Fi
- Housekeeping
- Airport Pickup

Food Menu:
- Breakfast: Idli, Dosa, Upma, Tea, Coffee
- Lunch: Veg Thali, Chicken Biryani, Paneer Curry
- Dinner: Roti, Rice, Dal, Mixed Veg, Chicken Curry
- Snacks: Sandwich, French Fries, Juice

Hotel Amenities:
- Free Wi-Fi
- Parking
- Restaurant
- 24/7 Front Desk

Policies:
- Check-in: 2:00 PM
- Check-out: 12:00 PM
- Cancellation: 24 hours prior to arrival

Please edit this content to match your actual PDF document.`;
      } else {
        // For text files, read the content normally
        content = await file.text();
      }
    } catch (err) {
      console.error("Error reading file:", err);
      setError("Error reading file. Please try again.");
      return;
    }

    setDocumentForm((prev) => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^.]+$/, ""),
      sourceName: file.name,
      content: content
    }));
    
    if (fileType === "application/pdf") {
      setSuccess("PDF template loaded. Please edit the content to match your actual document.");
    }
  }

  async function handleDocumentSubmit() {
    if (!token || !hotelId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await createHotelDocument(token, {
        hotelId: hotelId,
        title: documentForm.title,
        sourceName: documentForm.sourceName,
        tags: splitTags(documentForm.tags),
        content: documentForm.content
      });

      setSuccess("Document uploaded successfully.");
      setDocumentForm({ title: "", sourceName: "manual upload", tags: "", content: "" });
      const docs = await getHotelDocuments(token, hotelId);
      setDocuments(docs);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteDocument(documentId) {
    if (!token || !documentId) return;
    
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }

    setSaving(true);
    setError("");
    
    try {
      await deleteHotelDocument(token, documentId);
      setSuccess("Document deleted successfully.");
      
      // Reload documents list
      const docs = await getHotelDocuments(token, hotelId);
      setDocuments(docs);
    } catch (err) {
      setError(`Failed to delete document: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddRoom() {
    if (!roomForm.roomNumber || !roomForm.type || !roomForm.price) return;
    
    setSaving(true);
    setError("");
    
    try {
      const newRoom = await createRoom(token, {
        hotelId: hotelId,
        roomNumber: roomForm.roomNumber,
        type: roomForm.type,
        floor: 1,
        maxOccupancy: parseInt(roomForm.capacity) || 2,
        capacity: parseInt(roomForm.capacity) || 2,
        price: parseFloat(roomForm.price) || 2500,
        amenities: [],
        status: roomForm.status === "available" ? "ready" : roomForm.status
      });
      
      setRooms([...rooms, { ...newRoom, id: newRoom._id, bookings: [] }]);
      setRoomForm({ roomNumber: "", type: "", price: "", status: "available", capacity: "" });
      setSuccess("Room added successfully and saved to database.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveRoom(id) {
    setSaving(true);
    setError("");
    
    try {
      await deleteRoom(token, id);
      setRooms(rooms.filter((r) => r.id !== id));
      setSuccess("Room removed successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function checkRoomAvailability(room, checkIn, checkOut) {
    if (!checkIn || !checkOut || !room.bookings) return true;
    
    const requestedCheckIn = new Date(checkIn);
    const requestedCheckOut = new Date(checkOut);
    
    return !room.bookings.some((booking) => {
      const bookingCheckIn = new Date(booking.checkIn);
      const bookingCheckOut = new Date(booking.checkOut);
      
      // Check if dates overlap
      return (
        (requestedCheckIn >= bookingCheckIn && requestedCheckIn < bookingCheckOut) ||
        (requestedCheckOut > bookingCheckIn && requestedCheckOut <= bookingCheckOut) ||
        (requestedCheckIn <= bookingCheckIn && requestedCheckOut >= bookingCheckOut)
      );
    });
  }

  function handleAddBooking() {
    if (!selectedRoomForBooking || !bookingForm.guestName || !bookingForm.checkIn || !bookingForm.checkOut) {
      setError("Please fill in all required booking fields");
      return;
    }

    const isAvailable = checkRoomAvailability(
      selectedRoomForBooking,
      bookingForm.checkIn,
      bookingForm.checkOut
    );

    if (!isAvailable) {
      setError("Room is not available for the selected dates");
      return;
    }

    const updatedRooms = rooms.map((room) => {
      if (room.id === selectedRoomForBooking.id) {
        return {
          ...room,
          bookings: [
            ...(room.bookings || []),
            {
              id: Date.now(),
              ...bookingForm,
              bookedAt: new Date().toISOString()
            }
          ]
        };
      }
      return room;
    });

    setRooms(updatedRooms);
    setSuccess(`Booking added for ${bookingForm.guestName}`);
    setBookingForm({
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      checkIn: "",
      checkOut: "",
      numberOfGuests: ""
    });
    setShowBookingForm(false);
    setSelectedRoomForBooking(null);
    setError("");
  }

  if (!state.session.ready || loading) {
    return <Loader rows={5} />;
  }

  if (!token) {
    return (
      <section className="mx-auto max-w-2xl card-glass surface-elevated rounded-[1.75rem] p-6 text-center">
        <p className="text-xs uppercase tracking-[0.32em] text-amber-100">Admin access</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Admin session is not available</h1>
      </section>
    );
  }

  if (!hotel) {
    return (
      <section className="mx-auto max-w-2xl card-glass surface-elevated rounded-[1.75rem] p-6 text-center">
        <h1 className="text-2xl font-semibold text-white">Hotel not found</h1>
        <Button onClick={() => navigate("/hotels-dashboard")} className="mt-4">
          Back to Hotels
        </Button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <button
              onClick={() => navigate("/hotels-dashboard")}
              className="mb-3 text-sm text-slate-400 hover:text-white transition-soft"
            >
              ← Back to Hotels
            </button>
            <h1 className="text-3xl font-semibold text-white">{hotel.name}</h1>
            <p className="mt-2 text-sm text-slate-400">{hotel.locationText}</p>
            {hotel.description && (
              <p className="mt-3 text-sm leading-7 text-slate-300">{hotel.description}</p>
            )}
          </div>
          {hotel.rating && (
            <Badge tone="accent">⭐ {hotel.rating}</Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="card-glass surface-elevated rounded-[1.75rem] p-2">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "overview", label: "Overview" },
            { id: "staff", label: "Staff Management" },
            { id: "documents", label: "Documents" },
            { id: "rooms", label: "Rooms" },
            { id: "bookings", label: "Bookings" },
            { id: "services", label: "Services" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-soft ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-amber-300 to-rose-300 text-slate-950"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
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

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
            <h2 className="text-xl font-semibold text-white">Hotel Information</h2>
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Hotel ID</p>
                <p className="mt-1 text-sm text-white font-mono">{hotel.id}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Starting Price</p>
                <p className="mt-1 text-lg font-semibold text-amber-300">₹{hotel.startingPrice} per night</p>
              </div>
              {hotel.latitude && hotel.longitude && (
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Coordinates</p>
                  <p className="mt-1 text-sm text-white">{hotel.latitude}, {hotel.longitude}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
            <h2 className="text-xl font-semibold text-white">Amenities</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {hotel.amenities && hotel.amenities.length > 0 ? (
                hotel.amenities.map((amenity, idx) => (
                  <Badge key={idx}>{amenity}</Badge>
                ))
              ) : (
                <p className="text-sm text-slate-400">No amenities listed</p>
              )}
            </div>
          </div>

          {hotel.photoUrl && (
            <div className="lg:col-span-2 card-glass surface-elevated rounded-[1.75rem] p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Hotel Photo</h2>
              <img
                src={hotel.photoUrl}
                alt={hotel.name}
                className="w-full h-96 object-cover rounded-2xl"
              />
            </div>
          )}
        </div>
      )}

      {activeTab === "staff" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
            <h2 className="text-xl font-semibold text-white">Add Staff Member</h2>
            <div className="mt-5 space-y-4">
              <input
                value={staffForm.name}
                onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                placeholder="Full Name"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
              <input
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                placeholder="Email"
                type="email"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
              <input
                value={staffForm.phone}
                onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                placeholder="Phone Number"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
              <input
                value={staffForm.password}
                onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                placeholder="Password"
                type="password"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
              <select
                value={staffForm.role}
                onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
              >
                <option value="front_desk">Front Desk</option>
                <option value="housekeeper">Housekeeper</option>
                <option value="manager">Manager</option>
              </select>
              <Button onClick={handleAddStaff} disabled={!staffForm.name || !staffForm.role || !staffForm.email || !staffForm.password || saving}>
                {saving ? "Adding..." : "Add Staff Member"}
              </Button>
            </div>
          </div>

          <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
            <h2 className="text-xl font-semibold text-white">Staff List</h2>
            <div className="mt-5 space-y-3">
              {staff.length === 0 ? (
                <p className="text-sm text-slate-400">No staff members added yet.</p>
              ) : (
                staff.map((member) => (
                  <div key={member.staffId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                        <p className="text-sm text-slate-400 capitalize">{member.role.replace('_', ' ')}</p>
                        {member.email && <p className="text-xs text-slate-500 mt-1">{member.email}</p>}
                        {member.phone && <p className="text-xs text-slate-500">{member.phone}</p>}
                      </div>
                      <button
                        onClick={() => handleRemoveStaff(member.staffId)}
                        className="text-red-400 hover:text-red-300 text-sm"
                        disabled={saving}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
            <h2 className="text-xl font-semibold text-white">Upload Document</h2>
            <p className="mt-2 text-sm text-slate-300">
              Upload PDF, DOC, DOCX, TXT, or MD files for hotel policies and information.
            </p>
            <div className="mt-5 space-y-4">
              <input
                value={documentForm.title}
                onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })}
                placeholder="Document Title"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
              <input
                value={documentForm.sourceName}
                onChange={(e) => setDocumentForm({ ...documentForm, sourceName: e.target.value })}
                placeholder="Source Name"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
              <input
                value={documentForm.tags}
                onChange={(e) => setDocumentForm({ ...documentForm, tags: e.target.value })}
                placeholder="Tags (comma-separated)"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
              <textarea
                value={documentForm.content}
                onChange={(e) => setDocumentForm({ ...documentForm, content: e.target.value })}
                rows={6}
                placeholder="Document content or paste text here"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
              <label className="block rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-4 text-sm text-slate-300 transition-soft hover:bg-white/[0.08] cursor-pointer">
                <span className="block text-white font-medium">📎 Attach File</span>
                <span className="mt-1 block text-xs text-slate-400">Supports PDF, DOC, DOCX, TXT, MD</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                  className="mt-3 block w-full text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-amber-300 file:px-4 file:py-2 file:font-semibold file:text-slate-950 file:cursor-pointer"
                  onChange={handleFileChange}
                />
              </label>
              <Button onClick={handleDocumentSubmit} disabled={saving || !documentForm.title}>
                {saving ? "Uploading..." : "Upload Document"}
              </Button>
            </div>
          </div>

          <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
            <h2 className="text-xl font-semibold text-white">Documents ({documents.length})</h2>
            <div className="mt-5 space-y-3 max-h-[600px] overflow-y-auto">
              {documents.length === 0 ? (
                <p className="text-sm text-slate-400">No documents uploaded yet.</p>
              ) : (
                documents.map((doc) => (
                  <div key={doc._id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{doc.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">{doc.sourceName}</p>
                        <p className="mt-2 text-sm text-slate-300 line-clamp-3">{doc.content}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(doc.tags || []).map((tag) => (
                            <Badge key={tag}>{tag}</Badge>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteDocument(doc._id)}
                        disabled={saving}
                        className="flex-shrink-0 rounded-xl bg-red-500/20 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/30 hover:text-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "rooms" && (
        <div className="space-y-6">
          {/* Date Range Selector */}
          <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
            <h2 className="text-xl font-semibold text-white">Check Availability</h2>
            <p className="mt-2 text-sm text-slate-300">Select dates to check room availability</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Check-in Date</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Check-out Date</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  min={checkInDate || new Date().toISOString().split('T')[0]}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Add Room Form */}
            <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
              <h2 className="text-xl font-semibold text-white">Add Room</h2>
              <div className="mt-5 space-y-4">
                <input
                  value={roomForm.roomNumber}
                  onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                  placeholder="Room Number"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                />
                <input
                  value={roomForm.type}
                  onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                  placeholder="Room Type (e.g., Deluxe, Suite)"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                />
                <input
                  value={roomForm.price}
                  onChange={(e) => setRoomForm({ ...roomForm, price: e.target.value })}
                  placeholder="Price per Night"
                  type="number"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                />
                <input
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                  placeholder="Capacity (number of guests)"
                  type="number"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                />
                <select
                  value={roomForm.status}
                  onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <Button onClick={handleAddRoom} disabled={!roomForm.roomNumber || !roomForm.type || !roomForm.price}>
                  Add Room
                </Button>
              </div>
            </div>

            {/* Rooms List */}
            <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
              <h2 className="text-xl font-semibold text-white">Rooms List ({rooms.length})</h2>
              <div className="mt-5 space-y-3 max-h-[600px] overflow-y-auto">
                {rooms.length === 0 ? (
                  <p className="text-sm text-slate-400">No rooms added yet.</p>
                ) : (
                  rooms.map((room) => {
                    const isAvailable = checkRoomAvailability(room, checkInDate, checkOutDate);
                    const hasBookings = room.bookings && room.bookings.length > 0;
                    
                    return (
                      <div key={room.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-lg font-semibold text-white">Room {room.roomNumber}</h3>
                              <Badge tone={room.status === "available" ? "accent" : "default"}>
                                {room.status}
                              </Badge>
                              {checkInDate && checkOutDate && (
                                <Badge tone={isAvailable ? "accent" : "default"}>
                                  {isAvailable ? "Available" : "Booked"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-400 mt-1">{room.type}</p>
                            <p className="text-lg font-semibold text-amber-300 mt-2">₹{room.price}/night</p>
                            {room.capacity && (
                              <p className="text-xs text-slate-500 mt-1">Capacity: {room.capacity} guests</p>
                            )}
                            {hasBookings && (
                              <p className="text-xs text-emerald-400 mt-1">
                                {room.bookings.length} booking(s)
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveRoom(room.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        
                        {/* Add Booking Button */}
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedRoomForBooking(room);
                              setShowBookingForm(true);
                              setBookingForm({
                                ...bookingForm,
                                checkIn: checkInDate,
                                checkOut: checkOutDate
                              });
                            }}
                            className="rounded-xl bg-amber-300/20 px-3 py-2 text-sm font-medium text-amber-200 hover:bg-amber-300/30 transition-soft"
                          >
                            Add Booking
                          </button>
                          {hasBookings && (
                            <button
                              onClick={() => {
                                const roomBookingsList = room.bookings.map(b => 
                                  `${b.guestName} (${new Date(b.checkIn).toLocaleDateString()} - ${new Date(b.checkOut).toLocaleDateString()})`
                                ).join('\n');
                                alert(`Bookings for Room ${room.roomNumber}:\n\n${roomBookingsList}`);
                              }}
                              className="rounded-xl bg-blue-300/20 px-3 py-2 text-sm font-medium text-blue-200 hover:bg-blue-300/30 transition-soft"
                            >
                              View Bookings ({room.bookings.length})
                            </button>
                          )}
                        </div>

                        {/* Show bookings for this room */}
                        {hasBookings && (
                          <div className="mt-3 space-y-2">
                            {room.bookings.map((booking) => (
                              <div key={booking.id} className="rounded-xl border border-white/5 bg-white/5 p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-white">{booking.guestName}</p>
                                    <p className="text-xs text-slate-400 mt-1">{booking.guestEmail}</p>
                                    <p className="text-xs text-slate-400">{booking.guestPhone}</p>
                                    <p className="text-xs text-slate-500 mt-2">
                                      {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                                    </p>
                                    {booking.numberOfGuests && (
                                      <p className="text-xs text-slate-500">Guests: {booking.numberOfGuests}</p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleCancelBooking(room.id, booking.id)}
                                    className="text-xs text-red-400 hover:text-red-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Booking Form Modal */}
          {showBookingForm && selectedRoomForBooking && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="card-glass surface-elevated rounded-[1.75rem] p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">
                    Add Booking - Room {selectedRoomForBooking.roomNumber}
                  </h2>
                  <button
                    onClick={() => {
                      setShowBookingForm(false);
                      setSelectedRoomForBooking(null);
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <input
                    value={bookingForm.guestName}
                    onChange={(e) => setBookingForm({ ...bookingForm, guestName: e.target.value })}
                    placeholder="Guest Name *"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                  />
                  <input
                    value={bookingForm.guestEmail}
                    onChange={(e) => setBookingForm({ ...bookingForm, guestEmail: e.target.value })}
                    placeholder="Guest Email"
                    type="email"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                  />
                  <input
                    value={bookingForm.guestPhone}
                    onChange={(e) => setBookingForm({ ...bookingForm, guestPhone: e.target.value })}
                    placeholder="Guest Phone"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                  />
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Check-in Date *</label>
                    <input
                      type="date"
                      value={bookingForm.checkIn}
                      onChange={(e) => setBookingForm({ ...bookingForm, checkIn: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Check-out Date *</label>
                    <input
                      type="date"
                      value={bookingForm.checkOut}
                      onChange={(e) => setBookingForm({ ...bookingForm, checkOut: e.target.value })}
                      min={bookingForm.checkIn || new Date().toISOString().split('T')[0]}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
                    />
                  </div>
                  <input
                    value={bookingForm.numberOfGuests}
                    onChange={(e) => setBookingForm({ ...bookingForm, numberOfGuests: e.target.value })}
                    placeholder="Number of Guests"
                    type="number"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                  />
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setShowBookingForm(false);
                        setSelectedRoomForBooking(null);
                      }}
                      className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white hover:bg-white/10 transition-soft"
                    >
                      Cancel
                    </button>
                    <Button
                      onClick={handleAddBooking}
                      disabled={!bookingForm.guestName || !bookingForm.checkIn || !bookingForm.checkOut}
                    >
                      Confirm Booking
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "services" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
            <h2 className="text-xl font-semibold text-white">Add Service</h2>
            <div className="mt-5 space-y-4">
              <input
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                placeholder="Service Name"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
              <input
                value={serviceForm.category}
                onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                placeholder="Category (e.g., Spa, Restaurant, Laundry)"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
              <textarea
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                placeholder="Service Description"
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
              <input
                value={serviceForm.price}
                onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                placeholder="Price"
                type="number"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
              <Button onClick={handleAddService} disabled={!serviceForm.name || !serviceForm.price}>
                Add Service
              </Button>
            </div>
          </div>

          <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
            <h2 className="text-xl font-semibold text-white">Services List</h2>
            <div className="mt-5 space-y-3">
              {services.length === 0 ? (
                <p className="text-sm text-slate-400">No services added yet.</p>
              ) : (
                services.map((service) => (
                  <div key={service.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                          {service.category && <Badge>{service.category}</Badge>}
                        </div>
                        {service.description && (
                          <p className="text-sm text-slate-300 mt-2">{service.description}</p>
                        )}
                        <p className="text-lg font-semibold text-amber-300 mt-2">₹{service.price}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveService(service.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "bookings" && (
        <div className="space-y-6">
          <div className="card-glass surface-elevated rounded-[1.75rem] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Hotel Bookings</h2>
              <button
                onClick={loadBookings}
                disabled={loadingBookings}
                className="rounded-xl bg-gradient-to-r from-amber-300 to-rose-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:from-amber-200 hover:to-rose-200 disabled:opacity-50"
              >
                {loadingBookings ? "Loading..." : "Refresh"}
              </button>
            </div>

            {loadingBookings ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300 mx-auto"></div>
                <p className="text-slate-400 mt-2">Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No bookings found for this hotel.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {/* Guest Information */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Guest Details</h3>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-300">
                            <span className="text-slate-400">Name:</span> {booking.guestName}
                          </p>
                          <p className="text-slate-300">
                            <span className="text-slate-400">Email:</span> {booking.guestEmail}
                          </p>
                          <p className="text-slate-300">
                            <span className="text-slate-400">ID:</span> {booking.govtIdType} - {booking.govtIdNumber}
                          </p>
                        </div>
                      </div>

                      {/* Room & Dates */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Booking Details</h3>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-300">
                            <span className="text-slate-400">Room:</span> {booking.roomNumber} ({booking.roomType})
                          </p>
                          <p className="text-slate-300">
                            <span className="text-slate-400">Check-in:</span> {new Date(booking.checkInDate).toLocaleDateString()}
                          </p>
                          <p className="text-slate-300">
                            <span className="text-slate-400">Check-out:</span> {new Date(booking.checkOutDate).toLocaleDateString()}
                          </p>
                          <p className="text-slate-300">
                            <span className="text-slate-400">Booked:</span> {new Date(booking.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Status & Payment */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Status & Payment</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-sm">Status:</span>
                            <select
                              value={booking.status}
                              onChange={(e) => handleBookingStatusChange(booking.id, e.target.value)}
                              className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-sm text-white outline-none"
                            >
                              <option value="confirmed">Confirmed</option>
                              <option value="checked_in">Checked In</option>
                              <option value="checked_out">Checked Out</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-sm">Payment:</span>
                            <Badge 
                              className={
                                booking.paymentStatus === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                                booking.paymentStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                                booking.paymentStatus === 'failed' ? 'bg-red-500/20 text-red-300' :
                                'bg-gray-500/20 text-gray-300'
                              }
                            >
                              {booking.paymentStatus}
                            </Badge>
                          </div>
                          <p className="text-lg font-semibold text-amber-300">
                            ₹{booking.totalAmount}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
