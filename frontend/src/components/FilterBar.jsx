import { Search, Map, MapPinOff } from 'lucide-react';

export default function FilterBar({ filters, setFilters, onSearch, showMap, setShowMap }) {
  const propertyTypes = ['All', 'Apartment', 'House', 'Villa', 'Cabin', 'Studio'];

  const handlePriceChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setFilters((prev) => ({ ...prev, maxPrice: '' }));
      return;
    }
    const positiveValue = Math.max(0, Number(raw));
    setFilters((prev) => ({ ...prev, maxPrice: positiveValue.toString() }));
  };

  return (
    <div className="relative border border-[#262522] bg-[#0E0E0D] p-3 sm:p-4 shadow-2xl backdrop-blur-md">
      {/* Precision corner ticks */}
      <span className="absolute -top-1 -left-1 h-2 w-2 border-t border-l border-[#D2A52C]" />
      <span className="absolute -bottom-1 -right-1 h-2 w-2 border-b border-r border-[#D2A52C]" />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (onSearch) onSearch();
        }}
        className="flex flex-col gap-3 lg:flex-row lg:items-center"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-3 left-3.5 h-4 w-4 text-[#A5A095]" />
          <input
            type="text"
            placeholder="Search by city, title, or architectural locale..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full rounded-none border border-[#262522] bg-[#141413] py-2.5 pr-4 pl-10 text-xs sm:text-sm text-[#F4F0E6] placeholder-[#A5A095]/50 transition-colors focus:border-[#D2A52C] focus:bg-[#181816] focus:outline-none"
          />
        </div>

        {/* Property Type Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {propertyTypes.map((type) => {
            const active =
              filters.propertyType.toLowerCase() === type.toLowerCase() ||
              (type === 'All' && filters.propertyType === '');
            return (
              <button
                type="button"
                key={type}
                onClick={() =>
                  setFilters({
                    ...filters,
                    propertyType: type === 'All' ? '' : type.toLowerCase(),
                  })
                }
                className={`relative px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-all ${
                  active
                    ? 'bg-[#D2A52C] text-[#070707] font-bold shadow-[0_0_12px_rgba(210,165,44,0.3)]'
                    : 'border border-[#262522] bg-[#141413] text-[#A5A095] hover:border-[#3D3B35] hover:text-[#F4F0E6]'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>

        {/* Price & Cartography Toggle Row */}
        <div className="flex items-center gap-2">
          {/* Max Price Input */}
          <div className="relative w-full sm:w-32">
            <span className="absolute left-3 top-2.5 font-mono text-xs text-[#A5A095]/60">$</span>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="Max price"
              value={filters.maxPrice}
              onChange={handlePriceChange}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                  e.preventDefault();
                }
              }}
              className="w-full border border-[#262522] bg-[#141413] py-2 pr-3 pl-7 text-xs text-[#F4F0E6] placeholder-[#A5A095]/50 transition-colors focus:border-[#D2A52C] focus:bg-[#181816] focus:outline-none"
            />
          </div>

          {/* Cartography Toggle Button */}
          {setShowMap && (
            <button
              type="button"
              onClick={() => setShowMap((prev) => !prev)}
              title={showMap ? 'Hide map cartography' : 'Open map cartography'}
              className={`flex items-center gap-1.5 border px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors shrink-0 ${
                showMap
                  ? 'border-[#D2A52C] bg-[#D2A52C]/10 text-[#D2A52C]'
                  : 'border-[#262522] bg-[#141413] text-[#A5A095] hover:border-[#D2A52C] hover:text-[#F4F0E6]'
              }`}
            >
              {showMap ? (
                <>
                  <MapPinOff className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Hide Map</span>
                </>
              ) : (
                <>
                  <Map className="h-3.5 w-3.5 text-[#D2A52C]" />
                  <span className="hidden sm:inline">Cartography</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}