import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import FilterBar from '../components/FilterBar';
import ListingCard from '../components/ListingCard';
import ListingMap from '../components/ListingMap';
import { Compass, ChevronDown } from 'lucide-react';

export default function Home() {
  const [filters, setFilters] = useState({
    search: '',
    propertyType: '',
    maxPrice: '',
  });

  const [activeListing, setActiveListing] = useState(null);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

const [showMap, setShowMap] = useState(false);

  const { data: listings = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['listings', filters.search, filters.propertyType, filters.maxPrice],
    queryFn: async () => {
      const params = {};
      if (filters.propertyType) params.type = filters.propertyType;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.search) params.search = filters.search;

      const res = await api.get('/listings', { params });
      return res.data;
    },
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  });

  // Extract first image of each property dynamically
  const propertyHeroImages = listings
    .map((item) => ({
      id: item._id,
      title: item.title,
      price: item.price,
      address: item.address,
      image:
        item.images?.[0] ||
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80',
    }))
    .filter((p) => Boolean(p.image));

  // Automatically cycle through real property photos across full viewport hero
  useEffect(() => {
    if (propertyHeroImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % propertyHeroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [propertyHeroImages.length]);

  const currentDisplayProperty = propertyHeroImages[currentHeroIndex] || {
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',
    title: 'Architectural Sanctuaries',
    address: 'Curated indexed dwellings',
    price: 0,
  };

  const scrollToContent = () => {
    const el = document.getElementById('discovery-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* Full Viewport Width & Height Hero Section */}
      <section className="relative h-screen w-screen -ml-[50vw] left-1/2 right-1/2 overflow-hidden bg-[#070707] flex items-center justify-center">
        {/* Dynamic Background Image Layers */}
        {propertyHeroImages.length > 0 ? (
          propertyHeroImages.map((prop, idx) => (
            <div
              key={prop.id || idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentHeroIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
              } transition-transform duration-[7000ms]`}
            >
              <img
                src={prop.image}
                alt={prop.title}
                className="h-full w-full object-cover object-center"
              />
            </div>
          ))
        ) : (
          <img
            src={currentDisplayProperty.image}
            alt="Hero Background"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        )}

        {/* Film grain & Atmospheric Dark Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E0D] via-black/60 to-black/40 backdrop-blur-[0.5px]" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#D2A52C]/10 blur-[120px]" />

        {/* Centered Hero Content Overlaid on Full Viewport */}
<div className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 text-center space-y-6">
  <div className="inline-flex max-w-full items-center gap-2 border border-[#D2A52C]/30 
   bg-black/60 px-4 py-1.5 backdrop-blur-md">
    <span className="h-2 w-2 shrink-0 rounded-full bg-[#D2A52C] animate-pulse" />
    <span className="whitespace-normal break-words font-mono text-xs uppercase tracking-[0.3em] text-[#F4F0E6]">
      HabitatX Architectural Collection
    </span>
  </div>

  <h1 className="mx-auto w-full max-w-4xl break-words whitespace-normal font-['Syne'] text-4xl font-bold leading-tight tracking-tight text-[#F4F0E6] sm:text-6xl lg:text-7xl">
    Architectural Living & Place Discovery
  </h1>

  <p className="mx-auto w-full max-w-2xl break-words whitespace-normal font-mono text-xs sm:text-sm 
   uppercase tracking-widest text-[#A5A095] leading-relaxed">
    Curated concrete, timber, and glass sanctuaries indexed across Islamabad.
  </p>

  {/* Currently Showcased Property Badge */}
  {propertyHeroImages.length > 0 && (
    <div className="w-full pt-2">
      <span className="inline-block max-w-full break-words border border-[#262522] bg-[#0E0E0D]/80 px-3 py-1 font-mono text-[11px] text-[#A5A095] backdrop-blur-sm">
        Featuring:{' '}
        <strong className="break-words text-[#D2A52C]">
          {currentDisplayProperty.title}
        </strong>{' '}
        — PKR {currentDisplayProperty.price}/night
      </span>
    </div>
  )}

  {/* Dynamic Property Thumbnail Switchers */}
  {propertyHeroImages.length > 0 && (
    <div className="mx-auto flex w-full max-w-xl items-center justify-start sm:justify-center gap-2 overflow-x-auto py-2 pt-6 scrollbar-thin scrollbar-thumb-[#D2A52C]/40 scrollbar-track-transparent">
      {propertyHeroImages.map((item, idx) => (
        <button
          type="button"
          key={item.id}
          onClick={() => {
            setCurrentHeroIndex(idx);
            const matchedListing = listings.find((l) => l._id === item.id);
            if (matchedListing) setActiveListing(matchedListing);
          }}
          className={`group relative h-12 w-16 shrink-0 cursor-pointer overflow-hidden border transition-all duration-300 ${
            currentHeroIndex === idx
              ? 'border-[#D2A52C] ring-2 ring-[#D2A52C]/50 scale-105'
              : 'border-[#262522] opacity-60 hover:opacity-100 hover:border-[#D2A52C]'
          }`}
          title={item.title}
        >
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent" />
        </button>
      ))}
    </div>
  )}

  {/* Scroll Down Trigger */}
  <div className="pt-8 pb-4">
    <button
      type="button"
      onClick={scrollToContent}
      className="inline-flex max-w-full items-center gap-2 border border-[#262522] bg-[#141413]/80 px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#A5A095] transition hover:border-[#D2A52C] hover:text-[#F4F0E6]"
    >
      <span className="whitespace-nowrap">Explore Dwellings</span>
      <ChevronDown className="h-3.5 w-3.5 shrink-0 animate-bounce text-[#D2A52C]" />
    </button>
  </div>
</div>
      </section>

      {/* Main Body Section */}
{/* Main Body Section */}
{/* Main Body Section */}
      <div id="discovery-section" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter Component with Map Toggle Integration */}
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          onSearch={refetch}
          showMap={showMap}
          setShowMap={setShowMap}
        />

        {/* Collapsible Architectural Map Banner */}
        {showMap && (
          <div className="mt-6 h-80 sm:h-96 w-full rounded-sm border border-[#262522] bg-[#0E0E0D] overflow-hidden shadow-2xl transition-all duration-300">
            <ListingMap listings={listings} activeListing={activeListing} />
          </div>
        )}

        {/* Multi-Column Directory Grid */}
        <div className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="flex flex-col border border-[#262522] bg-[#0E0E0D] p-4 space-y-3 animate-pulse">
                  <div className="aspect-[16/10] w-full bg-[#1A1A18]" />
                  <div className="h-4 w-3/4 bg-[#1A1A18]" />
                  <div className="h-3 w-1/2 bg-[#1A1A18]" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="border border-rose-900/40 bg-rose-950/20 p-8 text-center text-xs font-mono uppercase tracking-wider text-rose-300">
              Connection interrupted. Unable to sync architectural records with the registry server.
            </div>
          ) : listings.length === 0 ? (
            <div className="border border-[#262522] bg-[#0E0E0D] p-16 text-center">
              <Compass className="mx-auto h-10 w-10 text-[#65635D] animate-spin" />
              <h3 className="mt-4 font-['Syne'] text-base font-semibold text-[#F4F0E6]">No dwellings match this query</h3>
              <p className="mt-1 font-mono text-xs text-[#A5A095]">
                Adjust your price threshold or location query to rediscover available spaces.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing._id}
                  listing={listing}
                  onHover={(item) => setActiveListing(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
