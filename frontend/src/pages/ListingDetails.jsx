import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapPin, Bed, Bath, ArrowLeft, CheckCircle2, User as UserIcon, Calendar, AlertCircle, Lock, Clock, Star, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch details of this listing
  const {
    data: listing,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const res = await api.get(`/listings/${id}`);
      return res.data;
    },
    enabled: Boolean(id),
  });

  // 2. Fetch active reservations strictly for this listing
  const { data: reservedDates = [] } = useQuery({
    queryKey: ['listing-bookings', id],
    queryFn: async () => {
      const res = await api.get(`/bookings/listing/${id}`);
      return res.data;
    },
    enabled: Boolean(id),
  });

  // 3. Fetch reviews and aggregate rating for this listing
  const { data: reviewData = { reviews: [], averageRating: 0, totalReviews: 0 } } = useQuery({
    queryKey: ['listing-reviews', id],
    queryFn: async () => {
      try {
        const res = await api.get(`/reviews/listing/${id}`);
        return res.data;
      } catch {
        return { reviews: [], averageRating: 0, totalReviews: 0 };
      }
    },
    enabled: Boolean(id),
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  });

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const listingStatusBadge = useMemo(() => {
    const hasConfirmed = reservedDates.some((b) => b.status === 'confirmed');
    if (hasConfirmed) {
      return {
        label: 'Reserved & Locked',
        color: 'bg-rose-950/70 text-rose-300 border-rose-800/40',
        icon: Lock,
      };
    }
    const hasPending = reservedDates.some((b) => b.status === 'pending');
    if (hasPending) {
      return {
        label: 'Inquiry Pending',
        color: 'bg-amber-950/70 text-amber-300 border-amber-800/40',
        icon: Clock,
      };
    }
    return {
      label: 'Available For Habitation',
      color: 'bg-[#181816] text-[#D2A52C] border-[#D2A52C]/40',
      icon: CheckCircle2,
    };
  }, [reservedDates]);

  const maxCheckOutDate = useMemo(() => {
    if (!checkIn) return undefined;
    const selectedStart = new Date(checkIn);

    const futureBookings = reservedDates
      .map((b) => new Date(b.startDate))
      .filter((date) => date > selectedStart)
      .sort((a, b) => a - b);

    if (futureBookings.length > 0) {
      return futureBookings[0].toISOString().split('T')[0];
    }
    return undefined;
  }, [checkIn, reservedDates]);

  const calculateTotal = () => {
    if (!checkIn || !checkOut) return { nights: 0, total: 0 };
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (nights <= 0) return { nights: 0, total: 0 };
    return {
      nights,
      total: nights * (listing?.price || 0),
    };
  };

  const { nights, total } = calculateTotal();

  const checkOverlap = (startDateStr, endDateStr) => {
    const selStart = new Date(startDateStr);
    const selEnd = new Date(endDateStr);

    return reservedDates.some((b) => {
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);
      return selStart < bEnd && selEnd > bStart;
    });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role === 'landlord') {
      setBookingError('Landlords cannot book properties. Please sign in with a tenant account.');
      return;
    }

    if (!checkIn || !checkOut) {
      setBookingError('Please choose both check-in and check-out dates.');
      return;
    }

    if (nights <= 0) {
      setBookingError('Check-out date must be after check-in date.');
      return;
    }

    if (checkOverlap(checkIn, checkOut)) {
      setBookingError('The selected dates overlap with an existing reservation for this property.');
      return;
    }

    try {
      setIsSubmitting(true);

      const bookingData = {
        listingId: listing._id,
        listing: listing._id,
        startDate: checkIn,
        endDate: checkOut,
        checkIn,
        checkOut,
        totalPrice: total,
      };

      await api.post('/bookings', bookingData);

      await queryClient.invalidateQueries({ queryKey: ['bookings', user?._id] });
      await queryClient.invalidateQueries({ queryKey: ['listing-bookings', id] });

      navigate('/bookings');
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to complete booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#070707] text-[#F4F0E6]">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 border border-[#262522] bg-[#111110] animate-pulse" />
          <div className="absolute h-5 w-5 border-2 border-[#D2A52C] border-t-transparent animate-spin" />
        </div>
        <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.3em] text-[#A5A095]">
          ARCHITECTURAL RECORD // LOADING SPECIFICATIONS
        </p>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h2 className="font-['Syne'] text-2xl font-bold text-[#F4F0E6]">Structure Not Indexed</h2>
        <p className="mt-2 text-sm text-[#A5A095]">This dwelling record has been archived or removed from the registry.</p>
        <Link to="/" className="mt-6 inline-block border border-[#D2A52C] bg-[#D2A52C] px-5 py-2 font-mono text-xs uppercase tracking-wider text-[#070707]">
          Return to Registry
        </Link>
      </div>
    );
  }

  const rawCoords = listing.location?.coordinates;
  const validCoords =
    Array.isArray(rawCoords) &&
    rawCoords.length === 2 &&
    !isNaN(Number(rawCoords[0])) &&
    !isNaN(Number(rawCoords[1]));

  const position = validCoords ? [Number(rawCoords[1]), Number(rawCoords[0])] : [33.6844, 73.0479];
  const StatusIcon = listingStatusBadge.icon;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Editorial Return Link */}
      <Link
        to="/"
        className="group mb-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#A5A095] transition hover:text-[#D2A52C]"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
        <span>Return to index</span>
      </Link>

      {/* Header Info Banner */}
<div className="mb-5 flex flex-wrap items-start sm:items-end justify-between gap-3 sm:gap-6 border-b border-[#262522] pb-4 sm:mb-8 sm:pb-6">
  <div className="space-y-2.5">
    <h1 className="font-['Syne'] text-xl font-bold tracking-tight text-[#F4F0E6] sm:text-3xl lg:text-4xl leading-tight">
      {listing.title}
    </h1>

    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <span className="border border-[#262522] bg-[#111110] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#D2A52C] sm:px-3 sm:py-1 sm:text-[10px]">
        {listing.propertyType || listing.type || 'Structure'}
      </span>

      <span className="flex items-center gap-1 font-mono text-[11px] text-[#A5A095] sm:gap-1.5 sm:text-xs">
        <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#D2A52C] shrink-0" />
        <span className="truncate max-w-[200px] sm:max-w-none">
          {listing.address}{listing.city ? `, ${listing.city}` : ''}
        </span>
      </span>

      {/* Responsive divider: bullet dot on mobile, vertical border on tablet/desktop */}
      <span className="inline sm:hidden text-[#65635D]">•</span>

      <span className="flex items-center gap-1 sm:border-l sm:border-[#262522] sm:pl-3 font-mono text-[11px] text-[#F4F0E6] sm:text-xs">
        <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-[#D2A52C] text-[#D2A52C] shrink-0" />
        <span className="font-bold">{reviewData?.averageRating > 0 ? reviewData.averageRating : 'New'}</span>
        <span className="text-[#A5A095]">({reviewData?.totalReviews || 0} reviews)</span>
      </span>
    </div>
  </div>

  {/* Dynamic Status Tag */}
  <div className={`inline-flex items-center gap-1.5 sm:gap-2 border px-2.5 py-1 sm:px-3 sm:py-1.5 font-mono text-[10px] sm:text-xs uppercase tracking-wider backdrop-blur-md ${listingStatusBadge.color}`}>
    <StatusIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
    <span>{listingStatusBadge.label}</span>
  </div>
</div>

      {/* Editorial Photography Stage */}
      <div className="mb-12 grid grid-cols-1 gap-3 md:grid-cols-4 md:gap-4">
        <div className="aspect-[4/3] overflow-hidden border border-[#262522] bg-[#141413] md:col-span-2">
          <img
            src={listing.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80'}
            alt="Primary Architectural View"
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 md:col-span-2 md:gap-4">
          {(listing.images?.slice(1, 5) || []).map((img, idx) => (
            <div key={idx} className="aspect-[4/3] overflow-hidden border border-[#262522] bg-[#141413]">
              <img
                src={img}
                alt={`Perspective ${idx + 2}`}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          ))}
          {(!listing.images || listing.images.length < 5) &&
            Array.from({ length: Math.max(0, 4 - ((listing.images?.length || 1) - 1)) }).map((_, i) => (
              <div key={`empty-${i}`} className="hidden aspect-[4/3] border border-[#262522] bg-[#0E0E0D] md:flex items-center justify-center font-mono text-[10px] text-[#262522]" />
            ))}
        </div>
      </div>

      {/* Core Architectural Details Grid */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Left Column: Specifications */}
        <div className="space-y-10 lg:col-span-7">
          <div className="flex items-center gap-8 border-y border-[#262522] py-4 font-mono text-xs text-[#A5A095]">
            <span className="flex items-center gap-2">
              <Bed className="h-4 w-4 text-[#D2A52C]" />
              <strong className="text-[#F4F0E6]">{listing.bedrooms || 1}</strong> BEDROOM CHAMBERS
            </span>
            <span className="flex items-center gap-2 border-l border-[#262522] pl-8">
              <Bath className="h-4 w-4 text-[#D2A52C]" />
              <strong className="text-[#F4F0E6]">{listing.bathrooms || 1}</strong> BATH SUITES
            </span>
          </div>

          <div>
            <h2 className="font-['Syne'] text-lg font-bold uppercase tracking-wider text-[#F4F0E6]">Architectural Narrative</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#A5A095] whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {listing.amenities && listing.amenities.length > 0 && (
            <div className="border-t border-[#262522] pt-8">
              <h2 className="font-['Syne'] text-lg font-bold uppercase tracking-wider text-[#F4F0E6]">Amenities & Features</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {listing.amenities.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 border border-[#262522] bg-[#0E0E0D] p-3 text-xs text-[#F4F0E6]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#D2A52C]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Host Authentication Badge */}
          <div className="border border-[#262522] bg-[#0E0E0D] p-5">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#A5A095]">Host & Steward</h3>
            <div className="mt-3 flex items-center gap-4">
              {listing.landlord?.avatar ? (
                <img
                  src={listing.landlord.avatar}
                  alt={listing.landlord.name}
                  className="h-12 w-12 rounded-full border border-[#262522] object-cover ring-1 ring-[#D2A52C]/30"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center border border-[#262522] bg-[#141413] text-[#D2A52C]">
                  <UserIcon className="h-5 w-5" />
                </div>
              )}
              <div>
                <p className="font-['Syne'] text-sm font-semibold text-[#F4F0E6]">{listing.landlord?.name || 'Architectural Steward'}</p>
                <p className="font-mono text-xs text-[#A5A095]">{listing.landlord?.email || 'Verified Host'}</p>
              </div>
            </div>
          </div>

          {/* Spatial Cartography */}
          <div className="border-t border-[#262522] pt-8">
            <h2 className="font-['Syne'] text-lg font-bold uppercase tracking-wider text-[#F4F0E6]">Geographic Position</h2>
            <p className="mt-1 font-mono text-xs text-[#A5A095] mb-4">{listing.address}{listing.city ? `, ${listing.city}` : ''}</p>
            <div className="h-72 w-full overflow-hidden border border-[#262522]">
              <MapContainer key={`details-map-${id}`} center={position} zoom={13} scrollWheelZoom={false} className="h-full w-full">
                <TileLayer
                  attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                />
                <Marker position={position}>
                  <Popup>{listing.title}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>

          {/* Tenant Reviews Panel */}
          <div className="border-t border-[#262522] pt-8">
            <div className="flex items-center justify-between">
              <h2 className="font-['Syne'] text-lg font-bold uppercase tracking-wider text-[#F4F0E6]">Tenant Impressions</h2>
              <div className="flex items-center gap-1.5 border border-[#262522] bg-[#111110] px-3 py-1 font-mono text-xs text-[#F4F0E6]">
                <Star className="h-3 w-3 fill-[#D2A52C] text-[#D2A52C]" />
                <span>{reviewData.averageRating > 0 ? reviewData.averageRating : 'New'}</span>
                <span className="text-[#A5A095]">({reviewData.totalReviews})</span>
              </div>
            </div>

            {reviewData.reviews.length === 0 ? (
              <p className="mt-4 font-mono text-xs text-[#A5A095]">No guest accounts documented for this structure.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {reviewData.reviews.map((rev) => (
                  <div key={rev._id} className="border border-[#262522] bg-[#0E0E0D] p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {rev.tenant?.avatar ? (
                          <img
                            src={rev.tenant.avatar}
                            alt={rev.tenant.name}
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center border border-[#262522] bg-[#181816] text-[10px] font-bold text-[#D2A52C]">
                            {rev.tenant?.name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div>
                          <p className="font-mono text-xs font-semibold text-[#F4F0E6]">{rev.tenant?.name || 'Verified Resident'}</p>
                          <p className="font-mono text-[10px] text-[#A5A095]">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex text-[#D2A52C] text-xs">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < rev.rating ? 'text-[#D2A52C]' : 'text-[#262522]'}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-[#A5A095]">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Reservation Terminal */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 border border-[#262522] bg-[#0E0E0D] p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-baseline justify-between border-b border-[#1E1E1C] pb-5">
              <div>
                <span className="font-['Syne'] text-2xl font-bold text-[#F4F0E6]">${listing.price}</span>
                <span className="font-mono text-xs text-[#A5A095]"> / NIGHT</span>
              </div>
              <span className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${listingStatusBadge.color}`}>
                {listingStatusBadge.label}
              </span>
            </div>

            {bookingError && (
              <div className="mt-4 flex items-start gap-2 border border-rose-900/50 bg-rose-950/20 p-3 text-xs text-rose-300 font-mono">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A5A095]">
                    Arrival Date
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={checkIn}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      if (checkOut && e.target.value >= checkOut) {
                        setCheckOut('');
                      }
                      if (bookingError) setBookingError('');
                    }}
                    required
                    className="mt-1 w-full border border-[#262522] bg-[#141413] px-3 py-2 font-mono text-xs text-[#F4F0E6] focus:border-[#D2A52C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#A5A095]">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    min={checkIn || todayStr}
                    max={maxCheckOutDate}
                    value={checkOut}
                    onChange={(e) => {
                      setCheckOut(e.target.value);
                      if (bookingError) setBookingError('');
                    }}
                    required
                    className="mt-1 w-full border border-[#262522] bg-[#141413] px-3 py-2 font-mono text-xs text-[#F4F0E6] focus:border-[#D2A52C] focus:outline-none"
                  />
                </div>
              </div>

              {/* Real-Time Reserved Dates */}
              {reservedDates.length > 0 && (
                <div className="border border-[#262522] bg-[#141413] p-3">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#D2A52C]">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Unavailable Dates</span>
                  </div>
                  <div className="mt-2 space-y-1 font-mono text-[11px] text-[#A5A095]">
                    {reservedDates.map((b) => (
                      <div key={b._id} className="flex items-center justify-between">
                        <span>
                          {new Date(b.startDate).toLocaleDateString()} – {new Date(b.endDate).toLocaleDateString()}
                        </span>
                        <span className="uppercase text-[#D2A52C]">({b.status})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {nights > 0 && (
                <div className="space-y-2 border border-[#262522] bg-[#141413] p-4 font-mono text-xs text-[#A5A095]">
                  <div className="flex justify-between">
                    <span>${listing.price} × {nights} NIGHT{nights > 1 ? 'S' : ''}</span>
                    <span className="text-[#F4F0E6]">${total}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#262522] pt-2 font-bold text-[#D2A52C]">
                    <span>ESTIMATED SUM</span>
                    <span>${total}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || listing.status === 'rented'}
                className="w-full border border-[#D2A52C] bg-[#D2A52C] py-3.5 font-mono text-xs uppercase tracking-widest font-bold text-[#070707] transition hover:bg-[#E3B53B] disabled:opacity-40 disabled:pointer-events-none shadow-[0_2px_15px_rgba(210,165,44,0.2)]"
              >
                {isSubmitting
                  ? 'COMMITTING RESERVATION...'
                  : listing.status === 'rented'
                  ? 'CURRENTLY UNAVAILABLE'
                  : 'REQUEST RESERVATION'}
              </button>
            </form>

            <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-wider text-[#A5A095]/60">
              Escrow lock applied upon steward confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}