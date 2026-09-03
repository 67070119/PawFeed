'use client';

import { MapContainer, Marker, TileLayer, ZoomControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const pickerIcon = L.divIcon({
  className: 'mapMarkerHost',
  html: '<div class="mapPickerMarker"><div class="mapPickerMarkerFace"><span></span></div><i></i></div>',
  iconSize: [48, 56],
  iconAnchor: [24, 52],
});

function Picker({ value, onChange }) {
  useMapEvents({ click(event) { onChange({ latitude:event.latlng.lat, longitude:event.latlng.lng }); } });
  if (!Number.isFinite(value.latitude) || !Number.isFinite(value.longitude)) return null;
  return <Marker position={[value.latitude, value.longitude]} icon={pickerIcon} />;
}

export default function MapPicker({ value, onChange }) {
  const center = Number.isFinite(value.latitude) && Number.isFinite(value.longitude) ? [value.latitude, value.longitude] : [13.7291,100.7789];
  return (
    <MapContainer center={center} zoom={16} className="pickerMap mapPickerCanvas" scrollWheelZoom zoomControl={false}>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ZoomControl position="bottomright" />
      <Picker value={value} onChange={onChange} />
    </MapContainer>
  );
}
