import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function ListingMap({ listings = [], activeListing }) {
  const defaultCenter = [33.6844, 73.0479];

  const center =
    activeListing?.location?.coordinates
      ? [activeListing.location.coordinates[1], activeListing.location.coordinates[0]]
      : listings.length > 0 && listings[0]?.location?.coordinates
      ? [listings[0].location.coordinates[1], listings[0].location.coordinates[0]]
      : defaultCenter;

  return (
    <div className="relative h-full w-full overflow-hidden border border-[#262522] bg-[#070707]">
      {/* Precision Frame Overlay */}
      <div className="pointer-events-none absolute top-3 left-3 z-[400] flex items-center gap-2 border border-[#262522] bg-[#0E0E0D]/90 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[#A5A095] backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-[#D2A52C] animate-pulse" />
        <span>SPATIAL CARTOGRAPHY // HABITATX</span>
      </div>

      <MapContainer
        center={center}
        zoom={listings.length > 0 ? 11 : 6}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        />

        <MapController center={center} zoom={activeListing ? 14 : 11} />

        {listings.map((item) => {
          const coords = item.location?.coordinates;
          if (!coords || coords.length < 2) return null;

          const position = [coords[1], coords[0]];

          return (
            <Marker key={item._id} position={position}>
              <Popup>
                <div className="max-w-[200px] bg-[#0E0E0D] p-1 font-sans text-xs text-[#F4F0E6]">
                  <img
                    src={
                      item.images?.[0] ||
                      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={item.title}
                    className="h-24 w-full object-cover border border-[#262522] mb-2"
                  />
                  <p className="font-['Syne'] font-semibold text-[#F4F0E6] line-clamp-1">{item.title}</p>
                  <div className="mt-1 flex items-baseline justify-between border-t border-[#1E1E1C] pt-1 font-mono">
                    <span className="text-[10px] text-[#A5A095] uppercase">Per Night</span>
                    <span className="font-bold text-[#D2A52C]">${item.price}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}