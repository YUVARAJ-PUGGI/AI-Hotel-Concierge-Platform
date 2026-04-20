import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/layout/Navbar.jsx";
import PageWrapper from "./components/layout/PageWrapper.jsx";
import Home from "./pages/Home.jsx";
import Results from "./pages/Results.jsx";
import HotelDetails from "./pages/HotelDetails.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import Booking from "./pages/Booking.jsx";
import Confirmation from "./pages/Confirmation.jsx";
import Concierge from "./pages/Concierge.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-app-gradient text-slate-100">
      <div className="ambient-backdrop" aria-hidden="true">
        <span className="ambient-orb orb-1" />
        <span className="ambient-orb orb-2" />
        <span className="ambient-orb orb-3" />
        <span className="ambient-noise" />
      </div>
      <Navbar />
      <PageWrapper>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/results" element={<Results />} />
          <Route path="/hotels/:hotelId" element={<HotelDetails />} />
          <Route path="/booking/:hotelId" element={<Booking />} />
          <Route path="/confirmation/:bookingId" element={<Confirmation />} />
          <Route path="/concierge/:bookingId" element={<Concierge />} />
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageWrapper>
    </div>
  );
}
