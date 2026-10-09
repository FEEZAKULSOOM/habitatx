import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Heart, Compass } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import ListingCard from '../components/ListingCard';

export default function SavedProperties() {
  const { user } = useAuthStore();

  const {
    data: savedListings = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['wishlist', user?._id],
    queryFn: async () => {
      const res = await api.get('/wishlist');
      return res.data;
    },
    enabled: Boolean(user?._id),
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Editorial Vault Header */}
      <div className="mb-8 border-b border-[#262522] pb-6">
        <div className="flex items-center gap-3">
          <Heart className="h-5 w-5 fill-[#D2A52C] text-[#D2A52C]" />
          <h1 className="font-['Syne'] text-2xl font-bold tracking-tight text-[#F4F0E6] sm:text-3xl">
            Curated Vault
          </h1>
        </div>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-[#A5A095]">
          Architectural spaces saved for active review and itinerary holding.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-80 border border-[#262522] bg-[#0E0E0D] animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="border border-rose-900/40 bg-rose-950/20 p-8 text-center font-mono text-xs uppercase tracking-wider text-rose-300">
          Failed to sync your saved repository with the remote engine.
        </div>
      ) : savedListings.length === 0 ? (
        <div className="border border-[#262522] bg-[#0E0E0D] p-16 text-center">
          <Compass className="mx-auto h-12 w-12 text-[#65635D]" />
          <h3 className="mt-4 font-['Syne'] text-base font-semibold text-[#F4F0E6]">The vault is currently empty</h3>
          <p className="mt-1 font-mono text-xs text-[#A5A095]">
            Save properties by activating the bookmark heart on any architectural listing.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block border border-[#D2A52C] bg-[#D2A52C] px-5 py-2.5 font-mono text-xs uppercase tracking-wider font-semibold text-[#070707] transition hover:bg-[#E3B53B]"
          >
            Explore Spaces
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {savedListings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}