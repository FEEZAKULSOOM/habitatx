import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, Compass, PlusCircle, Bookmark, LogOut, User as UserIcon, Shield, LayoutDashboard } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { socket } from '../../utils/socket.js';
import { useAuthStore } from '../store/useAuthStore';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isHostOrAdmin = user?.role === 'landlord' || user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperOrAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';

  const isActive = (path) => location.pathname === path;

  // Hosts/Admins manage reservations; regular tenants view their personal trips
  const bookingsPath = isHostOrAdmin ? '/admin/bookings' : '/bookings';

  // Real-time reservation count query
  const { data: badgeData } = useQuery({
    queryKey: ['booking-badge-count', user?._id],
    queryFn: async () => {
      const res = await api.get('/bookings/badge-count');
      return res.data;
    },
    enabled: Boolean(user?._id),
    staleTime: 1000 * 15,
  });

  const reservationCount = badgeData?.count || 0;

  // Real-time synchronization via Socket.IO
  useEffect(() => {
    if (!user?._id) return;

    const handleRealtimeUpdate = () => {
     queryClient.invalidateQueries({ queryKey: ['booking-badge-count'] });
    };

    socket.on('booking_updated', handleRealtimeUpdate);

    return () => {
      socket.off('booking_updated', handleRealtimeUpdate);
    };
  }, [user?._id, queryClient]);

  return (
    <>
      {/* 1. Primary Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-[#262522] bg-[#070707]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 py-3 sm:px-6 lg:px-8">
          
          {/* Architectural Brand Identity */}
          <Link to="/" className="group flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-sm bg-[#111110] border border-[#262522] text-[#D2A52C] transition-all duration-300 group-hover:border-[#D2A52C] group-hover:shadow-[0_0_15px_rgba(210,165,44,0.15)]">
              <Compass className="h-4 w-4 transition-transform duration-500 group-hover:rotate-45" />
            </div>
            <div className="flex flex-col">
              <span className="font-['Syne'] text-base sm:text-lg font-bold tracking-[0.22em] text-[#F4F0E6] uppercase transition-colors group-hover:text-white">
                HABITAT<span className="text-[#D2A52C]">X</span>
              </span>
              <span className="font-mono text-[7px] sm:text-[8px] uppercase tracking-widest text-[#A5A095] -mt-0.5">
                Discovery Engine
              </span>
            </div>
          </Link>

          {/* Right Action Stack */}
          <nav className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3.5 overflow-x-auto scrollbar-none max-w-full py-0.5">
            {isAuthenticated ? (
              <>
                {/* Desktop-only Workspace */}
                {isHostOrAdmin && (
                  <Link
                    to="/landlord/dashboard"
                    title="Workspace"
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-sm border border-[#262522] bg-[#111110] px-2.5 py-1.5 lg:px-3.5 lg:py-2 text-xs font-medium tracking-wide text-[#F4F0E6] transition-all duration-200 hover:border-[#3D3B35] hover:bg-[#181816] shrink-0"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 text-[#D2A52C]" />
                    <span className="hidden lg:inline">Workspace</span>
                  </Link>
                )}

                {/* Landlord / Superadmin Action */}
                {(user?.role === 'landlord' || user?.role === 'superadmin') && (
                  <Link
                    to="/create-listing"
                    className="inline-flex items-center gap-1.5 sm:gap-2 rounded-sm bg-[#D2A52C] px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold tracking-wide text-[#070707] transition-all duration-200 hover:bg-[#E3B53B] shadow-[0_2px_10px_rgba(210,165,44,0.2)] shrink-0"
                    title="Index Space"
                  >
                    <PlusCircle className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span className="hidden lg:inline text-xs">Index Space</span>
                  </Link>
                )}

                {/* Admin / Superadmin Action: Registry Oversight with Badge */}
                {isSuperOrAdmin && (
                  <Link
                    to="/admin/bookings"
                    title="Registry Oversight"
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-sm border border-[#3D3B35] bg-[#181816] px-2.5 py-1.5 lg:px-3.5 lg:py-2 text-xs font-semibold tracking-wide text-[#F4F0E6] transition hover:border-[#D2A52C]/60 shrink-0"
                  >
                    <div className="relative flex items-center">
                      <Shield className="h-3.5 w-3.5 text-[#D2A52C]" />
                      {reservationCount > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#D2A52C] px-1 font-mono text-[8px] font-bold text-[#070707] shadow-[0_0_6px_rgba(210,165,44,0.6)]">
                          {reservationCount > 99 ? '99+' : reservationCount}
                        </span>
                      )}
                    </div>
                    <span className="hidden xl:inline">Registry Oversight</span>
                  </Link>
                )}

                {/* Saved Properties */}
                <Link
                  to="/saved"
                  className="hidden md:inline-flex items-center gap-1.5 rounded-sm px-2 py-1.5 lg:px-3 lg:py-2 text-xs font-medium text-[#A5A095] transition hover:text-[#F4F0E6] hover:bg-[#111110] shrink-0"
                  title="Saved Places"
                >
                  <Heart className="h-3.5 w-3.5 text-[#A5A095] transition hover:text-[#D2A52C]" />
                  <span className="hidden lg:inline">Vault</span>
                </Link>

                {/* Bookings / Journeys Link: Hidden for Superadmin; Shows with Badge for Non-Superadmin */}
                {!isSuperAdmin && (
                  <Link
                    to={bookingsPath}
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-sm px-2 py-1.5 lg:px-3 lg:py-2 text-xs font-medium text-[#A5A095] transition hover:text-[#F4F0E6] hover:bg-[#111110] shrink-0"
                    title={isHostOrAdmin ? "Reservation Oversight" : "Your Itinerary"}
                  >
                    <div className="relative flex items-center">
                      <Bookmark className="h-3.5 w-3.5 text-[#A5A095]" />
                      {reservationCount > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#D2A52C] px-1 font-mono text-[8px] font-bold text-[#070707] shadow-[0_0_6px_rgba(210,165,44,0.6)]">
                          {reservationCount > 99 ? '99+' : reservationCount}
                        </span>
                      )}
                    </div>
                    <span className="hidden lg:inline">{isHostOrAdmin ? "Reservations" : "Journeys"}</span>
                  </Link>
                )}

                {/* User Profile & Sign Out Segment */}
                <div className="flex items-center gap-2 sm:gap-3 border-l border-[#262522] pl-2 sm:pl-4 shrink-0">
                  <div className="flex items-center gap-2">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-[#262522] object-cover ring-1 ring-[#D2A52C]/30"
                      />
                    ) : (
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-sm border border-[#262522] bg-[#111110] text-[#D2A52C]">
                        <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>
                    )}

                    <div className="hidden flex-col text-left lg:flex">
                      <span className="text-xs font-medium text-[#F4F0E6] leading-tight">{user?.name}</span>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#D2A52C]">
                        {user?.role}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    title="Sign out"
                    className="rounded-sm p-1.5 sm:p-2 text-[#A5A095] transition hover:bg-[#181816] hover:text-rose-400"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/login"
                  className="px-2.5 py-1.5 text-xs font-medium uppercase tracking-wider text-[#A5A095] transition hover:text-[#F4F0E6]"
                >
                  Access
                </Link>
                <Link
                  to="/register"
                  className="rounded-sm bg-[#D2A52C] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#070707] transition-all hover:bg-[#E3B53B] shadow-[0_2px_12px_rgba(210,165,44,0.18)]"
                >
                  Initiate
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* 2. Responsive Mobile Bottom Navigation Bar */}
      {isAuthenticated && (
        <aside aria-label="Mobile Navigation" className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t border-[#262522] bg-[#070707]/95 px-2 backdrop-blur-lg sm:hidden">
          {/* Saved Vault */}
          <Link
            to="/saved"
            className={`flex flex-col items-center gap-1 font-mono text-[9px] uppercase tracking-wider transition ${
              isActive('/saved') ? 'text-[#D2A52C]' : 'text-[#A5A095] hover:text-[#F4F0E6]'
            }`}
          >
            <Heart className="h-4 w-4" />
            <span>Vault</span>
          </Link>

          {/* Registry Oversight: On mobile for Admin & Super Admin with Badge */}
          {isSuperOrAdmin && (
            <Link
              to="/admin/bookings"
              className={`relative flex flex-col items-center gap-1 font-mono text-[9px] uppercase tracking-wider transition ${
                isActive('/admin/bookings') ? 'text-[#D2A52C]' : 'text-[#A5A095] hover:text-[#F4F0E6]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Shield className="h-4 w-4" />
                {reservationCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#D2A52C] px-1 font-mono text-[8px] font-bold text-[#070707] shadow-[0_0_6px_rgba(210,165,44,0.6)]">
                    {reservationCount > 99 ? '99+' : reservationCount}
                  </span>
                )}
              </div>
              <span>Oversight</span>
            </Link>
          )}

          {/* Bookings / Journeys: Strictly hidden for Superadmin; Shows with Badge for others */}
          {!isSuperAdmin && (
            <Link
              to={bookingsPath}
              className={`relative flex flex-col items-center gap-1 font-mono text-[9px] uppercase tracking-wider transition ${
                isActive(bookingsPath) ? 'text-[#D2A52C]' : 'text-[#A5A095] hover:text-[#F4F0E6]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Bookmark className="h-4 w-4" />
                {reservationCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#D2A52C] px-1 font-mono text-[8px] font-bold text-[#070707] shadow-[0_0_6px_rgba(210,165,44,0.6)]">
                    {reservationCount > 99 ? '99+' : reservationCount}
                  </span>
                )}
              </div>
              <span>{user?.role === 'landlord' ? 'Reservations' : 'Journeys'}</span>
            </Link>
          )}

          {/* Workspace for Landlord, Admin & Super Admin */}
          {isHostOrAdmin && (
            <Link
              to="/landlord/dashboard"
              className={`flex flex-col items-center gap-1 font-mono text-[9px] uppercase tracking-wider transition ${
                isActive('/landlord/dashboard') ? 'text-[#D2A52C]' : 'text-[#A5A095] hover:text-[#F4F0E6]'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Workspace</span>
            </Link>
          )}
        </aside>
      )}
    </>
  );
}