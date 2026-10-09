import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Bed,
  Bath,
  CheckCircle2,
  Clock,
  Lock,
  Heart,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

export default function ListingCard({ listing, onHover }) {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const imagesList = useMemo(() => {
    if (Array.isArray(listing.images) && listing.images.length > 0) {
      return listing.images;
    }
    return [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
    ];
  }, [listing.images]);

  const currentImage = imagesList[activeImageIndex] || imagesList[0];

  const handlePrevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  const displayType = listing.propertyType || listing.type || 'Property';

  // Real-time booking status query
  const { data: reservedDates = [] } = useQuery({
    queryKey: ['listing-bookings', listing._id],
    queryFn: async () => {
      const res = await api.get(`/bookings/listing/${listing._id}`);
      return res.data;
    },
    enabled: Boolean(listing?._id),
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  });

  // Get user's saved wishlist (strictly guarded by authentication)
  const { data: wishlist = [] } = useQuery({
    queryKey: ['wishlist', user?._id],
    queryFn: async () => {
      const res = await api.get('/wishlist');
      return res.data;
    },
    enabled: Boolean(isAuthenticated && user?._id),
    refetchInterval: 3000,
  });

  // Determine if item is saved in database
  const serverSaved = useMemo(() => {
    return wishlist.some((item) => (item._id || item) === listing._id);
  }, [wishlist, listing._id]);

  // Local optimistic state for instant UI reaction
  const [isSaved, setIsSaved] = useState(serverSaved);

  useEffect(() => {
    setIsSaved(serverSaved);
  }, [serverSaved]);

  // Optimistic mutation: updates visually on click, syncs in background
  const toggleMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/wishlist/${listing._id}`);
      return res.data;
    },
    onMutate: async () => {
      setIsSaved((prev) => !prev);
    },
    onError: () => {
      setIsSaved(serverSaved);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?._id] });
    },
  });

  const handleHeartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Please sign in to save properties to your wishlist.');
      return;
    }
    toggleMutation.mutate();
  };

  const statusBadge = useMemo(() => {
    if (listing.status === 'rented') {
      return {
        label: 'Unavailable',
        className: 'bg-rose-950/80 text-rose-300 border-rose-800/40',
        icon: Lock,
      };
    }

    const hasConfirmed = reservedDates.some((b) => b.status === 'confirmed');
    if (hasConfirmed) {
      return {
        label: 'Reserved',
        className: 'bg-rose-950/80 text-rose-300 border-rose-800/40',
        icon: Lock,
      };
    }

    const hasPending = reservedDates.some((b) => b.status === 'pending');
    if (hasPending) {
      return {
        label: 'Pending Inquiry',
        className: 'bg-amber-950/80 text-amber-300 border-amber-800/40',
        icon: Clock,
      };
    }

    return {
      label: 'Verified Available',
      className: 'bg-[#181816]/90 text-[#D2A52C] border-[#D2A52C]/40',
      icon: CheckCircle2,
    };
  }, [reservedDates, listing.status]);

  const StatusIcon = statusBadge.icon;

return (
    <article
      onMouseEnter={() => onHover && onHover(listing)}
      onMouseLeave={() => onHover && onHover(null)}
      className="group relative flex flex-col border border-[#262522] bg-[#0E0E0D] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#D2A52C]/40 hover:shadow-[0_12px_28px_rgba(0,0,0,0.6)]"
    >
      {/* 1. Slimmer 16:10 Ratio for controlled card height */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#141413]">
        <img
          src={currentImage}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Ambient Dark Gradient Layer */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0E0E0D] via-transparent to-black/25" />

        {/* Carousel Navigation Arrows */}
{/* Visible by default on touch/mobile (opacity-100), hidden until hover on desktop (sm:opacity-0 sm:group-hover:opacity-100) */}
{imagesList.length > 1 && (
  <div className="absolute inset-y-0 inset-x-2 z-20 flex items-center justify-between opacity-100 sm:opacity-0 transition-opacity duration-300 sm:group-hover:opacity-100">
    <button
      type="button"
      onClick={handlePrevImage}
      aria-label="Previous image"
      className="flex h-7 w-7 items-center justify-center rounded-sm border border-[#262522] bg-black/80 text-[#F4F0E6] backdrop-blur-md active:scale-90 active:border-[#D2A52C] active:text-[#D2A52C] sm:hover:border-[#D2A52C] sm:hover:text-[#D2A52C]"
    >
      <ChevronLeft className="h-4 w-4" />
    </button>
    <button
      type="button"
      onClick={handleNextImage}
      aria-label="Next image"
      className="flex h-7 w-7 items-center justify-center rounded-sm border border-[#262522] bg-black/80 text-[#F4F0E6] backdrop-blur-md active:scale-90 active:border-[#D2A52C] active:text-[#D2A52C] sm:hover:border-[#D2A52C] sm:hover:text-[#D2A52C]"
    >
      <ChevronRight className="h-4 w-4" />
    </button>
  </div>
)}

        {/* Image Indicator Dots */}
        {imagesList.length > 1 && (
          <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex items-center gap-1">
            {imagesList.map((_, dotIdx) => (
              <span
                key={dotIdx}
                className={`h-0.5 rounded-full transition-all duration-300 ${
                  activeImageIndex === dotIdx ? 'w-2.5 bg-[#D2A52C]' : 'w-1 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Status Badge */}
        <div
          className={`absolute top-2 left-2 flex items-center gap-1 border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider backdrop-blur-md ${statusBadge.className}`}
        >
          <StatusIcon className="h-2.5 w-2.5 shrink-0" />
          <span>{statusBadge.label}</span>
        </div>

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={handleHeartClick}
          className="absolute top-2 right-2 z-20 flex h-7 w-7 items-center justify-center border border-[#262522] bg-[#0E0E0D]/80 backdrop-blur-md transition-all hover:border-[#D2A52C] active:scale-95"
          title={isSaved ? 'Remove from saved' : 'Save property'}
        >
          <Heart
            className={`h-3 w-3 transition-colors ${
              isSaved
                ? 'fill-[#D2A52C] text-[#D2A52C]'
                : 'text-[#A5A095] group-hover:text-[#F4F0E6]'
            }`}
          />
        </button>

        {/* Typology Pill */}
        <div className="absolute bottom-2 right-2 border border-[#262522] bg-[#070707]/90 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#F4F0E6] backdrop-blur-md">
          {displayType}
        </div>
      </div>

      {/* 2. Compact Content Specifications */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1 text-[#A5A095]">
          <MapPin className="h-3 w-3 text-[#b5a57b] shrink-0" />
          <span className="truncate font-mono text-[10px] tracking-wide" title={listing.location?.address || listing.address}>
            {listing.location?.address || listing.address || 'Location on map'}
          </span>
        </div>

        <h3 
          className="mt-1.5 truncate font-['Syne'] text-sm font-semibold text-[#F4F0E6] transition-colors group-hover:text-[#D2A52C]" 
          title={listing.title}
        >
          {listing.title}
        </h3>

        {/* Architectural Specs */}
        <div className="mt-2.5 flex items-center gap-4 border-y border-[#1E1E1C] py-2 font-mono text-[10px] text-[#A5A095]">
          <span className="flex items-center gap-1">
            <Bed className="h-3 w-3 text-[#65635D]" />
            <span>{listing.bedrooms || 1} BED</span>
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3 w-3 text-[#65635D]" />
            <span>{listing.bathrooms || 1} BATH</span>
          </span>
        </div>

        {/* Price & Action Row */}
        <div className="mt-3 flex items-center justify-between pt-0.5">
          <div className="flex flex-col">
            <span className="font-mono text-[8px] uppercase tracking-widest text-[#A5A095]/60">RATE</span>
            <div className="flex items-baseline gap-1">
              <span className="font-['Syne'] text-base font-bold text-[#F4F0E6] whitespace-nowrap">
                PKR {listing.price?.toLocaleString()}
              </span>
              <span className="font-mono text-[9px] text-[#A5A095]">/ NIGHT</span>
            </div>
          </div>
<Link
  to={`/listings/${listing._id}`}
  className="group/link flex items-center gap-1 border border-[#262522] bg-[#141413] px-3.5 py-2 font-mono text-[11px] uppercase tracking-wider text-[#F4F0E6] transition-all hover:border-[#D2A52C] hover:text-[#D2A52C] active:border-[#D2A52C] active:text-[#D2A52C] active:bg-[#D2A52C]/10"
>
  <span>Inspect</span>
  <ArrowUpRight className="h-3 w-3 text-[#A5A095] transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 group-hover/link:text-[#D2A52C] group-active/link:text-[#D2A52C]" />
</Link>
        </div>
      </div>
    </article>
  );
}