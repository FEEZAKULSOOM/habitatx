import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#070707] text-[#F4F0E6]">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 border border-[#262522] bg-[#111110] animate-pulse" />
          <div className="absolute h-5 w-5 border-2 border-[#D2A52C] border-t-transparent animate-spin" />
        </div>
        <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.3em] text-[#A5A095]">
          AUTHORIZING ACCESS
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}