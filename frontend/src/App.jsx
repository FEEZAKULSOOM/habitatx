import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateListing from './pages/CreateListing';
import ListingDetails from './pages/ListingDetails';
import Bookings from './pages/Bookings';
import SavedProperties from './pages/SavedProperties';
import AdminBookings from './pages/AdminBookings';
import LandlordDashboard from './pages/LandlordDashboard';
import NotFound from './pages/NotFound';
export default function App() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#070707] text-[#F4F0E6]">
        {/* Architectural Loading State */}
        <div className="relative flex items-center justify-center">
          <div className="h-14 w-14 rounded-sm border border-[#262522] bg-[#111110] animate-pulse" />
          <div className="absolute h-6 w-6 border-2 border-[#D2A52C] border-t-transparent animate-spin rounded-sm" />
        </div>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-[#A5A095]">
          HABITATX // INITIALIZING RUNTIME
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col bg-[#070707] text-[#F4F0E6] selection:bg-[#D2A52C] selection:text-[#070707]">
      <Navbar />
      <main className="flex-1 w-full pt-16 pb-16 sm:pb-0">
  

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/listings/:id" element={<ListingDetails />} />

          {/* Authenticated Routes (Tenant & Landlord) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/bookings" element={<Bookings />} />
          </Route>

          {/* Landlord & Superadmin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['landlord', 'superadmin']} />}>
            <Route path="/create-listing" element={<CreateListing />} />
            <Route path="/landlord/dashboard" element={<LandlordDashboard />} />
          </Route>

          {/* Bookings Management (Landlord, Admin & Superadmin) */}
          <Route element={<ProtectedRoute allowedRoles={['landlord', 'admin', 'superadmin']} />}>
            <Route path="/admin/bookings" element={<AdminBookings />} />
          </Route>
          
          {/* Saved / Liked Properties */}
          <Route path="/saved" element={<SavedProperties />} />


          {/* Catch-All Unmatched Route: Catches any invalid URL */}
  <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}