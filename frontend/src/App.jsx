import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/layout/Navbar.jsx";
import PageWrapper from "./components/layout/PageWrapper.jsx";
import Loader from "./components/common/Loader.jsx";
import Home from "./pages/Home.jsx";
import Results from "./pages/Results.jsx";
import HotelDetails from "./pages/HotelDetails.jsx";
import Booking from "./pages/Booking.jsx";
import BookingPage from "./pages/BookingPage.jsx";
import Confirmation from "./pages/Confirmation.jsx";
import Concierge from "./pages/Concierge.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import HotelsDashboard from "./pages/HotelsDashboard.jsx";
import HotelManagement from "./pages/HotelManagement.jsx";
import Login from "./pages/Login.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import { useAppStore } from "./store/AppStoreContext.jsx";

function RequireAuth({ isReady, token, redirectTo, children }) {
  if (!isReady) {
    return <Loader rows={4} />;
  }

  if (!token) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

export default function App() {
  const { state } = useAppStore();

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
          <Route path="/login" element={<Navigate to="/login/user" replace />} />
          <Route path="/login/hotel" element={<Navigate to="/hotels-dashboard" replace />} />
          <Route path="/login/:role" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth isReady={state.session.ready} token={state.session.guestToken} redirectTo="/login/user">
                <UserDashboard />
              </RequireAuth>
            }
          />
          <Route path="/search" element={<Navigate to="/dashboard" replace />} />
          <Route path="/results" element={<Results />} />
          <Route path="/hotels/:hotelId" element={<HotelDetails />} />
          <Route path="/booking/:hotelId" element={<Booking />} />
          <Route path="/book/:hotelId" element={<BookingPage />} />
          <Route path="/confirmation/:bookingId" element={<Confirmation />} />
          <Route path="/concierge/:bookingId" element={<Concierge />} />
          <Route
            path="/staff"
            element={
              <RequireAuth isReady={state.session.ready} token={state.session.staffToken} redirectTo="/login/staff">
                <StaffDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={<AdminPanel />}
          />
          <Route
            path="/hotels-dashboard"
            element={<HotelsDashboard />}
          />
          <Route
            path="/hotel-management/:hotelId"
            element={<HotelManagement />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageWrapper>
    </div>
  );
}
