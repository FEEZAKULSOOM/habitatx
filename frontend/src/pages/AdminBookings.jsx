import { useState  , useEffect} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { socket } from '../../utils/socket.js';
import { Calendar, MapPin, Clock, Check, X, Shield, ArrowUpRight, Ban } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

export default function AdminBookings() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState(null);
  const [filterTab, setFilterTab] = useState('all');
// Change line 12 from:
// const isAuthorized = user?.role === 'admin' || user?.role === 'landlord';

// To:
const isAuthorized = user?.role === 'admin' || user?.role === 'landlord' || user?.role === 'superadmin';

  const {
    data: bookings = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const res = await api.get('/bookings/admin/all');
      return res.data;
    },
    enabled: Boolean(isAuthorized),
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  });

useEffect(() => {
    const handleBookingUpdate = () => {
      // Zero-delay cache refresh on admin panel and badge counter
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-badge-count'] });
    };

    socket.on('booking_created', handleBookingUpdate);
    socket.on('booking_updated', handleBookingUpdate);
    socket.on('booking_status_updated', handleBookingUpdate);
    socket.on('booking_deleted', handleBookingUpdate);

    return () => {
      socket.off('booking_created', handleBookingUpdate);
      socket.off('booking_updated', handleBookingUpdate);
      socket.off('booking_status_updated', handleBookingUpdate);
      socket.off('booking_deleted', handleBookingUpdate);
    };
  }, [queryClient]);
const handleStatusUpdate = async (bookingId, newStatus, listingId) => {
    try {
      setUpdatingId(bookingId);
      await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });

      await queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['booking-badge-count'] });
      if (listingId) {
        await queryClient.invalidateQueries({ queryKey: ['listing-bookings', listingId] });
      }
    } catch (err) {
      console.error('Failed to update booking status:', err);
      alert(err.response?.data?.message || 'Failed to update booking status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterTab === 'all') return true;
    return b.status === filterTab;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return 'border-emerald-800/40 bg-emerald-950/60 text-emerald-300';
      case 'rejected':
        return 'border-rose-800/40 bg-rose-950/60 text-rose-300';
      case 'cancelled':
        return 'border-zinc-800/40 bg-zinc-900/60 text-zinc-400';
        case 'approved':
        return 'border-[#D2A52C]/40 bg-[#D2A52C]/10 text-[#D2A52C]';
      default:
        return 'border-amber-800/40 bg-amber-950/60 text-amber-300';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
        case 'approved':
        return 'Awaiting Tenant Payment';
      default:
        return 'Pending Approval';
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
  };

  if (!isAuthorized) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <Shield className="mx-auto h-12 w-12 text-[#D2A52C]" />
        <h2 className="mt-4 font-['Syne'] text-2xl font-bold text-[#F4F0E6]">Clearance Restricted</h2>
        <p className="mt-2 font-mono text-xs text-[#A5A095]">Management access required.</p>
        <Link to="/" className="mt-6 inline-block border border-[#D2A52C] bg-[#D2A52C] px-5 py-2 font-mono text-xs uppercase text-[#070707]">
          Return to Interface
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-6 border-b border-[#262522] pb-6">
        <div>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
  <span className="inline-block border border-[#262522] bg-[#141413] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#D2A52C]">
    Management Console
  </span>
  <h1 className="font-['Syne'] text-xl font-bold tracking-tight text-[#F4F0E6] sm:text-3xl">
    Platform Reservations
  </h1>
</div>
          <p className="mt-1 font-mono text-xs uppercase tracking-wider text-[#A5A095]">
            Review, confirm, reject, or cancel tenant reservation requests for your properties.
          </p>
        </div>

        {/* Tab Filters */}
{/* Tab Filters with Smooth Mobile Scrolling */}
<div className="w-full max-w-full overflow-x-auto py-1 scrollbar-none">
  <div className="inline-flex min-w-max items-center gap-1 border border-[#262522] bg-[#0E0E0D] p-1 font-mono text-xs">
    {['all', 'pending', 'confirmed', 'rejected', 'cancelled'].map((tab) => (
      <button
        key={tab}
        type="button"
        onClick={() => setFilterTab(tab)}
        className={`shrink-0 px-3 py-1.5 uppercase transition ${
          filterTab === tab
            ? 'bg-[#D2A52C] text-[#070707] font-bold shadow-xs'
            : 'text-[#A5A095] hover:text-[#F4F0E6]'
        }`}
      >
        {tab}
      </button>
    ))}
  </div>
</div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-36 border border-[#262522] bg-[#0E0E0D] animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="border border-rose-900/40 bg-rose-950/20 p-8 text-center font-mono text-xs uppercase tracking-wider text-rose-300">
          Failed to load bookings. Ensure backend booking routes are active.
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="border border-[#262522] bg-[#0E0E0D] p-16 text-center">
          <Calendar className="mx-auto h-12 w-12 text-[#65635D]" />
          <h3 className="mt-4 font-['Syne'] text-base font-semibold text-[#F4F0E6]">No bookings in this category</h3>
          <p className="mt-1 font-mono text-xs text-[#A5A095]">Reservations requested by tenants will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filteredBookings.map((b) => (
            <div
              key={b._id}
              className="flex flex-col justify-between border border-[#262522] bg-[#0E0E0D] p-5 transition hover:border-[#3D3B35]"
            >
              <div>
<div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between border-b border-[#1E1E1C] pb-3">
  {/* Left Column: Status Badge, Title & Address */}
  <div className="min-w-0 flex-1 pr-2">
    <span className={`inline-block border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${getStatusBadge(b.status)}`}>
      {getStatusLabel(b.status)}
    </span>
    <h3 className="mt-2 font-['Syne'] text-sm sm:text-base font-semibold text-[#F4F0E6] truncate" title={b.listing?.title}>
      {b.listing?.title || 'Property Listing'}
    </h3>
    <p className="flex items-center gap-1 font-mono text-[11px] sm:text-xs text-[#A5A095] mt-0.5">
      <MapPin className="h-3 w-3 text-[#D2A52C] shrink-0" />
      <span className="truncate" title={b.listing?.address || 'Address on file'}>
        {b.listing?.address || 'Address on file'}
      </span>
    </p>
  </div>

  {/* Right Column: Price Stack (Wraps safely without clipping on mobile) */}
  <div className="flex items-baseline justify-between sm:flex-col sm:items-end sm:justify-start shrink-0 pt-1 sm:pt-0 border-t border-[#1E1E1C]/50 sm:border-t-0 font-mono">
    <span className="text-[9px] uppercase tracking-widest text-[#A5A095]">Total</span>
    <span className="font-['Syne'] text-base sm:text-lg font-bold text-[#F4F0E6] whitespace-nowrap">
      PKR {b.totalPrice?.toLocaleString()}
    </span>
  </div>
</div>
                <div className="mt-4 grid grid-cols-2 gap-3 border border-[#262522] bg-[#141413] p-3 font-mono text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-[#A5A095]">Tenant</span>
                    <p className="truncate text-[#F4F0E6] font-medium">{b.tenant?.name || 'Unknown'}</p>
                    <p className="truncate text-[10px] text-[#A5A095]">{b.tenant?.email}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#A5A095]">Host</span>
                    <p className="truncate text-[#F4F0E6] font-medium">{b.landlord?.name || 'Unknown'}</p>
                    <p className="truncate text-[10px] text-[#A5A095]">{b.landlord?.email}</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs text-[#A5A095]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#D2A52C]" />
                    <span>In: <strong className="text-[#F4F0E6]">{formatDate(b.startDate || b.checkIn)}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#D2A52C]" />
                    <span>Out: <strong className="text-[#F4F0E6]">{formatDate(b.endDate || b.checkOut)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#1E1E1C] pt-3">
                {b.listing?._id ? (
                  <Link
                    to={`/listings/${b.listing._id}`}
                    className="flex items-center gap-1 font-mono text-xs text-[#D2A52C] hover:underline"
                  >
                    <span>Inspect</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                ) : (
                  <div />
                )}

                {/* Host Actions: Conditional based on current booking status */}
                <div className="flex items-center gap-2">

{/* Actions for Pending Bookings: Reject or Approve for Payment */}
                  {b.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        disabled={updatingId === b._id}
                        onClick={() => handleStatusUpdate(b._id, 'rejected', b.listing?._id)}
                        className="inline-flex items-center gap-1.5 border border-rose-900/50 bg-rose-950/30 px-3 py-1.5 font-mono text-xs text-rose-300 transition hover:bg-rose-900/60 disabled:opacity-40"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        disabled={updatingId === b._id}
                        onClick={() => handleStatusUpdate(b._id, 'approved', b.listing?._id)}
                        className="inline-flex items-center gap-1.5 border border-[#D2A52C] bg-[#D2A52C] px-3.5 py-1.5 font-mono text-xs font-bold text-[#070707] transition hover:bg-[#E3B53B] disabled:opacity-40"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Approve</span>
                      </button>
                    </>
                  )}

                  {/* Actions for Approved: Waiting for Tenant Payment */}
                  {b.status === 'approved' && (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#D2A52C]">
                      Awaiting Tenant Payment
                    </span>
                  )}
                  {/* Actions for Confirmed Bookings: Host can cancel if an emergency/issue arises */}
                  {b.status === 'confirmed' && (
                    <button
                      type="button"
                      disabled={updatingId === b._id}
                      onClick={() => handleStatusUpdate(b._id, 'cancelled', b.listing?._id)}
                      className="inline-flex items-center gap-1.5 border border-amber-900/50 bg-amber-950/30 px-3 py-1.5 font-mono text-xs text-amber-300 transition hover:bg-amber-900/60 disabled:opacity-40"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      <span>{updatingId === b._id ? 'Cancelling...' : 'Cancel Confirmed'}</span>
                    </button>
                  )}

                  {/* For Rejected or Cancelled Bookings: Actions are permanently locked */}
                  {(b.status === 'rejected' || b.status === 'cancelled') && (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#65635D]">
                      Actions Locked
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}