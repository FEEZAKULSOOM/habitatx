import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { socket } from '../../utils/socket.js';
import {
  Calendar,
  MapPin,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Star,
  Building,
  Receipt,
  Printer,
  X,
  Ban
} from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

export default function Bookings() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [receiptBooking, setReceiptBooking] = useState(null);
  const invoiceRef = useRef(null);

  const {
    data: bookings = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['bookings', user?._id],
    queryFn: async () => {
      const res = await api.get('/bookings/my-bookings');
      return res.data;
    },
    enabled: Boolean(user?._id),
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  });

  // Permanently removes the booking record from the MongoDB database via DELETE (Used for cancelling unfinalized requests)
  const deletePermanentlyMutation = useMutation({
    mutationFn: async (bookingId) => {
      const res = await api.delete(`/bookings/${bookingId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['listing-bookings'] });
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to cancel reservation.');
    },
  });

  // Soft dismissal mutation: Clears the item from user's view while keeping the record in MongoDB
  const dismissMutation = useMutation({
    mutationFn: async (bookingId) => {
      const res = await api.patch(`/bookings/${bookingId}/dismiss`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', user?._id] });
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to dismiss record.');
    },
  });

  const [payingId, setPayingId] = useState(null);

  const handlePayWithSafepay = async (bookingId) => {
    try {
      setPayingId(bookingId);
      const res = await api.post(`/bookings/${bookingId}/checkout`);
      const { checkoutUrl, trackerToken } = res.data;

      if (!checkoutUrl) {
        alert('Could not start Safepay session');
        setPayingId(null);
        return;
      }

      // Open Safepay in a clean focused popup window
      const width = 520;
      const height = 720;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        checkoutUrl,
        'SafepayPayment',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
      );

      let isFinalized = false;

      const triggerImmediateFinalize = async () => {
        if (isFinalized) return;
        isFinalized = true;
        clearInterval(timer);
        window.removeEventListener('message', handleMessage);

        // 1. Optimistically switch state to confirmed in cache immediately (0ms delay)
        queryClient.setQueryData(['bookings', user?._id], (oldBookings) => {
          if (!Array.isArray(oldBookings)) return oldBookings;
          return oldBookings.map((b) =>
            b._id === bookingId
              ? { ...b, status: 'confirmed', paymentStatus: 'paid' }
              : b
          );
        });

        setPayingId(null);

        try {
          // 2. Persist confirmation in MongoDB via backend
          const finalizeRes = await api.post(`/bookings/${bookingId}/finalize-payment`, {
            tracker: trackerToken,
          });

          // 3. Update query cache with server confirmed object
          if (finalizeRes.data?.booking) {
            queryClient.setQueryData(['bookings', user?._id], (oldBookings) => {
              if (!Array.isArray(oldBookings)) return oldBookings;
              return oldBookings.map((b) =>
                b._id === bookingId ? { ...b, ...finalizeRes.data.booking } : b
              );
            });
          }

          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
          queryClient.invalidateQueries({ queryKey: ['booking-badge-count'] });
        } catch (err) {
          console.error('Finalize error:', err);
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
        }
      };

      // Listen for instant postMessage from Safepay redirect/webhook
      const handleMessage = (event) => {
        if (event.data === 'safepay_complete' || event.data?.type === 'safepay_complete') {
          if (popup && !popup.closed) popup.close();
          triggerImmediateFinalize();
        }
      };
      window.addEventListener('message', handleMessage);

      // Fast-interval polling (300ms) to catch close instant without delay
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          triggerImmediateFinalize();
        }
      }, 300);
    } catch (err) {
      alert(err.response?.data?.message || 'Payment initiation failed');
      setPayingId(null);
    }
  };

  // URL Redirection fallback (if window redirects back directly)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const orderId = params.get('order_id');

    if (paymentStatus === 'success' && orderId) {
      // Optimistic instant update
      queryClient.setQueryData(['bookings', user?._id], (oldBookings) => {
        if (!Array.isArray(oldBookings)) return oldBookings;
        return oldBookings.map((b) =>
          b._id === orderId
            ? { ...b, status: 'confirmed', paymentStatus: 'paid' }
            : b
        );
      });

      api.post(`/bookings/${orderId}/finalize-payment`, {})
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
          queryClient.invalidateQueries({ queryKey: ['booking-badge-count'] });
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((err) => console.error('Fallback confirmation error:', err));
    }
  }, [queryClient, user?._id]);

  useEffect(() => {
    const handleBookingUpdate = (payload) => {
      // If payment was settled, immediately mutate the local item to confirmed
      if (payload?.booking?._id) {
        queryClient.setQueryData(['bookings', user?._id], (oldBookings) => {
          if (!Array.isArray(oldBookings)) return oldBookings;
          return oldBookings.map((b) =>
            b._id === payload.booking._id ? { ...b, ...payload.booking, status: 'confirmed' } : b
          );
        });
      }

      // Zero-delay cache refresh
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['listing-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-badge-count'] });
    };

    socket.on('booking_updated', handleBookingUpdate);
    socket.on('booking_status_updated', handleBookingUpdate);

    return () => {
      socket.off('booking_updated', handleBookingUpdate);
      socket.off('booking_status_updated', handleBookingUpdate);
    };
  }, [queryClient, user?._id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReview(true);
      await api.post('/reviews', {
        bookingId: reviewBooking._id,
        rating,
        comment,
      });
      alert('Thank you! Your review has been submitted.');
      setReviewBooking(null);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['bookings', user?._id] });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return {
          label: 'Confirmed Reservation',
          className: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40',
          icon: CheckCircle2,
        };
      case 'approved':
        return {
          label: 'Approved (Payment Required)',
          className: 'bg-[#D2A52C]/10 text-[#D2A52C] border-[#D2A52C]/40',
          icon: Clock,
        };
      case 'rejected':
        return {
          label: 'Rejected by Host',
          className: 'bg-rose-950/60 text-rose-300 border-rose-800/40',
          icon: XCircle,
        };
      case 'cancelled':
        return {
          label: 'Cancelled by Host',
          className: 'bg-zinc-900/60 text-zinc-400 border-zinc-800/40',
          icon: Ban,
        };
      default:
        return {
          label: 'Awaiting Host Approval',
          className: 'bg-amber-950/60 text-amber-300 border-amber-800/40',
          icon: Clock,
        };
    }
  };

  const calculateNights = (start, end) => {
    if (!start || !end) return 1;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-6 w-48 bg-[#141413] animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 border border-[#262522] bg-[#0E0E0D] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center border border-rose-900 bg-rose-950 text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-['Syne'] text-xl font-bold text-[#F4F0E6]">Itinerary Record Unreachable</h2>
        <p className="mt-1 font-mono text-xs text-[#A5A095]">Backend booking microservice failed to return data.</p>
      </div>
    );
  }

  const handleDismiss = async (bookingId) => {
    try {
      await api.patch(`/bookings/${bookingId}/dismiss`);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    } catch (error) {
      console.error('Failed to dismiss record:', error);
      alert(error.response?.data?.message || 'Could not dismiss this record');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: 1px solid #000 !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: auto;
            margin: 12mm;
          }
        }
      `}</style>

      {/* Header */}
      <div className="mb-8 border-b border-[#262522] pb-6">
        <h1 className="font-['Syne'] text-2xl font-bold tracking-tight text-[#F4F0E6] sm:text-3xl">Active Itineraries</h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-[#A5A095]">
          Manage and monitor reservation requests across your places.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="border border-[#262522] bg-[#0E0E0D] p-16 text-center">
          <Building className="mx-auto h-12 w-12 text-[#65635D]" />
          <h3 className="mt-4 font-['Syne'] text-base font-semibold text-[#F4F0E6]">No reserved itineraries recorded</h3>
          <p className="mt-1 font-mono text-xs text-[#A5A095]">You have not initiated a reservation for any indexed structure.</p>
          <Link
            to="/"
            className="mt-6 inline-block border border-[#D2A52C] bg-[#D2A52C] px-5 py-2.5 font-mono text-xs uppercase tracking-wider font-semibold text-[#070707] transition hover:bg-[#E3B53B]"
          >
            Explore Places
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const badge = getStatusBadge(booking.status);
            const BadgeIcon = badge.icon;
            const listing = booking.listing || {};

            return (
              <div
                key={booking._id}
                className="flex flex-col gap-5 border border-[#262522] bg-[#0E0E0D] p-5 transition hover:border-[#3D3B35] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="relative h-20 w-24 shrink-0 overflow-hidden border border-[#262522] bg-[#141413]">
                    <img
                      src={
                        listing.images?.[0] ||
                        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80'
                      }
                      alt={listing.title || 'Listing'}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${badge.className}`}>
                        <BadgeIcon className="h-3 w-3" />
                        {badge.label}
                      </span>
                    </div>

                    <h3 className="mt-2 font-['Syne'] text-base font-semibold text-[#F4F0E6] line-clamp-1">
                      {listing.title || 'Property Listing'}
                    </h3>

                    <div className="mt-1 flex items-center gap-1.5 font-mono text-xs text-[#A5A095]">
                      <MapPin className="h-3.5 w-3.5 text-[#D2A52C] shrink-0" />
                      <span>{listing.address || 'Address provided upon confirmation'}</span>
                    </div>

                    <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-[#A5A095]">
                      <Calendar className="h-3.5 w-3.5 text-[#D2A52C]" />
                      <span>
                        {new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between gap-4 border-t border-[#1E1E1C] pt-4 sm:border-0 sm:pt-0">
                  <div className="text-right font-mono">
                    <span className="text-xl font-bold text-[#F4F0E6] font-['Syne']">${booking.totalPrice}</span>
                    <span className="block text-[9px] uppercase tracking-widest text-[#A5A095]">Escrow Total</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 1. Pending or Approved (Unpaid): Hard delete from database */}
                    {(booking.status === 'pending' || booking.status === 'approved') && (
                      <button
                        type="button"
                        onClick={() => deletePermanentlyMutation.mutate(booking._id)}
                        disabled={deletePermanentlyMutation.isPending}
                        className="cursor-pointer border border-rose-900/60 bg-rose-950/40 px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider text-rose-300 transition hover:bg-rose-900/70 hover:text-white disabled:opacity-50"
                      >
                        {deletePermanentlyMutation.isPending && deletePermanentlyMutation.variables === booking._id
                          ? 'Cancelling...'
                          : 'Cancel Request'}
                      </button>
                    )}

                    {/* 2. Confirmed: Locked with financial settlement; cannot hard delete */}
                    {booking.status === 'confirmed' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setReceiptBooking(booking)}
                          className="inline-flex items-center gap-1.5 border border-[#262522] bg-[#141413] px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider text-[#F4F0E6] hover:border-[#D2A52C]"
                        >
                          <Receipt className="h-3.5 w-3.5 text-[#D2A52C]" />
                          <span>E-Receipt</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewBooking(booking)}
                          className="inline-flex items-center gap-1.5 border border-[#D2A52C] bg-[#D2A52C] px-4 py-1.5 font-mono text-xs uppercase tracking-wider font-semibold text-[#070707] hover:bg-[#E3B53B]"
                        >
                          <Star className="h-3.5 w-3.5 fill-[#070707]" />
                          <span>Leave Review</span>
                        </button>
                      </>
                    )}

                    {/* 3. Rejected or Cancelled: Dismiss from personal view */}
                    {(booking.status === 'rejected' || booking.status === 'cancelled') && (
                      <button
                        type="button"
                        onClick={() => dismissMutation.mutate(booking._id)}
                        disabled={dismissMutation.isPending}
                        className="inline-flex items-center gap-1 border border-[#262522] bg-[#141413] px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider text-[#A5A095] hover:text-[#F4F0E6] disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>
                          {dismissMutation.isPending && dismissMutation.variables === booking._id
                            ? 'Dismissing...'
                            : 'Dismiss Record'}
                        </span>
                      </button>
                    )}

                    {/* 4. Approved: Action button to trigger payment */}
                    {booking.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => handlePayWithSafepay(booking._id)}
                        disabled={payingId === booking._id}
                        className="inline-flex items-center gap-1.5 border border-[#D2A52C] bg-[#D2A52C] px-4 py-1.5 font-mono text-xs uppercase tracking-wider font-bold text-[#070707] transition hover:bg-[#E3B53B] disabled:opacity-50"
                      >
                        <span>{payingId === booking._id ? 'Connecting Gateway...' : 'Pay via Safepay'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invoice Modal */}
      {receiptBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div
            id="printable-invoice"
            className="relative w-full max-w-xl border border-[#262522] bg-[#0E0E0D] p-6 text-[#F4F0E6] sm:p-8"
          >
            <button
              type="button"
              onClick={() => setReceiptBooking(null)}
              className="no-print absolute top-5 right-5 p-1 text-[#A5A095] hover:text-[#F4F0E6]"
            >
              <X className="h-5 w-5" />
            </button>

            <div ref={invoiceRef} className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#262522] pb-5">
                <div>
                  <span className="font-['Syne'] text-xl font-bold tracking-[0.2em] uppercase text-[#F4F0E6]">
                    HABITAT<span className="text-[#D2A52C]">X</span>
                  </span>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#A5A095]">Spatial Habitation Receipt</p>
                </div>
                <div className="text-right font-mono">
                  <p className="text-xs font-bold text-[#F4F0E6]">
                    INV-#{receiptBooking._id.slice(-6).toUpperCase()}
                  </p>
                  <p className="text-[10px] text-[#A5A095]">
                    {new Date(receiptBooking.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-[#A5A095]">Tenant</span>
                  <p className="font-bold text-[#F4F0E6] mt-0.5">{user?.name}</p>
                  <p className="text-[#A5A095] text-[11px]">{user?.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-widest text-[#A5A095]">Dwelling</span>
                  <p className="font-bold text-[#F4F0E6] mt-0.5">{receiptBooking.listing?.title}</p>
                  <p className="text-[#A5A095] text-[11px]">{receiptBooking.listing?.address}</p>
                </div>
              </div>

              <div className="border border-[#262522] bg-[#141413] p-4 font-mono text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[#A5A095]">Check-in:</span>
                    <span className="ml-2 font-bold text-[#F4F0E6]">
                      {new Date(receiptBooking.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#A5A095]">Check-out:</span>
                    <span className="ml-2 font-bold text-[#F4F0E6]">
                      {new Date(receiptBooking.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#262522] pt-4 font-mono text-xs space-y-2 text-[#A5A095]">
                {(() => {
                  const nights = calculateNights(receiptBooking.startDate, receiptBooking.endDate);
                  const nightlyRate = Math.round(receiptBooking.totalPrice / nights);
                  return (
                    <>
                      <div className="flex justify-between">
                        <span>Stay Duration (${nightlyRate} × {nights} nights)</span>
                        <span className="text-[#F4F0E6]">${receiptBooking.totalPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Spatial Platform Escrow</span>
                        <span className="text-[#D2A52C]">Verified ($0)</span>
                      </div>
                      <div className="flex justify-between border-t border-[#262522] pt-3 text-sm font-bold text-[#F4F0E6]">
                        <span>Settled in Full</span>
                        <span className="text-[#D2A52C]">${receiptBooking.totalPrice}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="border border-[#262522] bg-[#141413] p-2.5 text-center font-mono text-[10px] uppercase tracking-wider text-[#D2A52C]">
                Status: Verified & Confirmed Habitation Record
              </div>
            </div>

            <div className="no-print mt-6 flex justify-end gap-3 border-t border-[#262522] pt-4">
              <button
                type="button"
                onClick={() => setReceiptBooking(null)}
                className="border border-[#262522] bg-[#141413] px-4 py-2 font-mono text-xs uppercase text-[#A5A095] hover:text-[#F4F0E6]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="inline-flex items-center gap-2 border border-[#D2A52C] bg-[#D2A52C] px-5 py-2 font-mono text-xs uppercase font-bold text-[#070707] hover:bg-[#E3B53B]"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md border border-[#262522] bg-[#0E0E0D] p-6 text-[#F4F0E6]">
            <h3 className="font-['Syne'] text-base font-bold text-[#F4F0E6]">
              Tenant Evaluation // {reviewBooking.listing?.title}
            </h3>
            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A5A095]">Architectural Rating</label>
                <div className="mt-1 flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-2xl transition-transform hover:scale-110 ${star <= rating ? 'text-[#D2A52C]' : 'text-[#262522]'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A5A095]">Feedback & Reflections</label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Record your experience regarding light, noise, structure, and amenities..."
                  className="mt-1.5 w-full border border-[#262522] bg-[#141413] p-3 font-mono text-xs text-[#F4F0E6] focus:border-[#D2A52C] focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewBooking(null)}
                  className="border border-[#262522] bg-[#141413] px-4 py-2 font-mono text-xs uppercase text-[#A5A095] hover:text-[#F4F0E6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="border border-[#D2A52C] bg-[#D2A52C] px-5 py-2 font-mono text-xs uppercase font-bold text-[#070707] hover:bg-[#E3B53B] disabled:opacity-50"
                >
                  {submittingReview ? 'Registering...' : 'Submit Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}