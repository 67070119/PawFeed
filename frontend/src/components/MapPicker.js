'use client';

import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const pickerIcon = L.divIcon({
  className: 'mapMarkerHost',
  html: '<div class="mapPickerMarker"><div class="mapPickerMarkerFace"><span></span></div><i></i></div>',
  iconSize: [48, 56],
  iconAnchor: [24, 52],
});

function Picker({ value, onChange, interactive }) {
  useMapEvents({
    click(event) {
      if (!interactive) return;
      onChange?.({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    },
  });

  if (!Number.isFinite(Number(value.latitude)) || !Number.isFinite(Number(value.longitude))) return null;
  return <Marker position={[Number(value.latitude), Number(value.longitude)]} icon={pickerIcon} interactive={false} />;
}

function PositionController({ value, interactive }) {
  const map = useMap();
  useEffect(() => {
    const latitude = Number(value.latitude);
    const longitude = Number(value.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    if (interactive) map.flyTo([latitude, longitude], Math.max(map.getZoom(), 16), { animate: true, duration: 0.7 });
    else map.setView([latitude, longitude], 16, { animate: false });
  }, [map, value.latitude, value.longitude, interactive]);
  return null;
}

export default function MapPicker({ value, onChange, interactive = true, preview = false }) {
  const latitude = Number(value.latitude);
  const longitude = Number(value.longitude);
  const center = Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : [13.7291, 100.7789];

  return (
    <MapContainer
      center={center}
      zoom={16}
      className={`pickerMap mapPickerCanvas${preview ? ' mapPickerPreviewCanvas' : ''}`}
      dragging={interactive}
      scrollWheelZoom={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      keyboard={interactive}
      zoomControl={false}
    >
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {interactive && <ZoomControl position="bottomright" />}
      <PositionController value={value} interactive={interactive} />
      <Picker value={value} onChange={onChange} interactive={interactive} />
    </MapContainer>
  );
}
