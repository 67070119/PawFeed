'use client';

import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const pickerIcon = L.divIcon({
  className: 'mapMarkerHost',
  html: '<div class="mapPickerMarker"><span></span></div>',
  iconSize: [42, 48],
  iconAnchor: [21, 46],
});

function Picker({ value, onChange }) {
  useMapEvents({ click(event) { onChange({ latitude:event.latlng.lat, longitude:event.latlng.lng }); } });
  if (!Number.isFinite(value.latitude) || !Number.isFinite(value.longitude)) return null;
  return <Marker position={[value.latitude, value.longitude]} icon={pickerIcon} />;
}

export default function MapPicker({ value, onChange }) {
  const center = Number.isFinite(value.latitude) && Number.isFinite(value.longitude) ? [value.latitude, value.longitude] : [13.7291,100.7789];
  return (
    <MapContainer center={center} zoom={16} className="pickerMap mapPickerCanvas" scrollWheelZoom>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Picker value={value} onChange={onChange} />
    </MapContainer>
  );
}
