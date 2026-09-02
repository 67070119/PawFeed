'use client';

import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const pickerIcon = L.divIcon({ className:'', html:'<div style="font-size:34px;filter:drop-shadow(0 5px 8px rgba(0,0,0,.2))">📍</div>', iconSize:[34,42], iconAnchor:[17,42] });

function Picker({ value, onChange }) {
  useMapEvents({ click(event) { onChange({ latitude:event.latlng.lat, longitude:event.latlng.lng }); } });
  if (!Number.isFinite(value.latitude) || !Number.isFinite(value.longitude)) return null;
  return <Marker position={[value.latitude, value.longitude]} icon={pickerIcon} />;
}

export default function MapPicker({ value, onChange }) {
  const center = Number.isFinite(value.latitude) && Number.isFinite(value.longitude) ? [value.latitude, value.longitude] : [13.7291,100.7789];
  return (
    <MapContainer center={center} zoom={16} className="pickerMap" scrollWheelZoom>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Picker value={value} onChange={onChange} />
    </MapContainer>
  );
}
