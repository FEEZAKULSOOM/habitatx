import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

function ClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect({ lat, lng });
    },
  });
  return null;
}

export default function LocationPickerMap({ coordinates, setCoordinates }) {
  const defaultCenter = [33.6844, 73.0479];
  const position = coordinates ? [coordinates.lat, coordinates.lng] : defaultCenter;

  return (
    <div className="relative h-64 w-full overflow-hidden border border-[#262522] bg-[#070707]">
      {/* Precision helper label */}
      <div className="pointer-events-none absolute top-2 right-2 z-[400] border border-[#262522] bg-[#0E0E0D]/90 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-[#D2A52C] backdrop-blur-md">
        Click to pinpoint coordinates
      </div>

      <MapContainer
        center={position}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full cursor-crosshair"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onLocationSelect={setCoordinates} />
        {coordinates && <Marker position={[coordinates.lat, coordinates.lng]} />}
      </MapContainer>
    </div>
  );
}