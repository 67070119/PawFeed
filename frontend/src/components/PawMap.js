'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { relativeTime } from '../lib/api';

const KMITL = [13.7291, 100.7789];
const ANIMALS = {
  DOG: { label: 'สุนัขจรจัด', code: 'D', tone: 'dog' },
  CAT: { label: 'แมวจรจัด', code: 'C', tone: 'cat' },
  OTHER: { label: 'สัตว์จรจัด', code: 'O', tone: 'other' },
};

function animalIcon(animalType) {
  const item = ANIMALS[animalType] || ANIMALS.OTHER;
  return L.divIcon({
    className: 'mapMarkerHost',
    html: `<div class="mapAnimalMarker mapAnimalMarker--${item.tone}"><span>${item.code}</span></div>`,
    iconSize: [42, 48],
    iconAnchor: [21, 46],
    popupAnchor: [0, -42],
  });
}

const userIcon = L.divIcon({
  className: 'mapMarkerHost',
  html: '<div class="mapUserMarker"><span></span></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function BoundsWatcher({ onBoundsChange }) {
  const map = useMapEvents({ moveend: emit, zoomend: emit });
  function emit() {
    const b = map.getBounds();
    onBoundsChange({ minLat: b.getSouth(), maxLat: b.getNorth(), minLng: b.getWest(), maxLng: b.getEast() });
  }
  useEffect(() => { emit(); }, []);
  return null;
}

function LocateUser({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.setView(position, Math.max(map.getZoom(), 15), { animate: true }); }, [position, map]);
  if (!position) return null;
  return <Marker position={position} icon={userIcon} zIndexOffset={900} />;
}

export default function PawMap({ points, onBoundsChange, userPosition }) {
  return (
    <MapContainer center={KMITL} zoom={14} className="mapCanvas pawMapCanvas" scrollWheelZoom>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <BoundsWatcher onBoundsChange={onBoundsChange} />
      <LocateUser position={userPosition} />
      {points.map((point) => {
        const animal = ANIMALS[point.animalType] || ANIMALS.OTHER;
        return (
          <Marker key={point.id} position={[point.latitude, point.longitude]} icon={animalIcon(point.animalType)}>
            <Popup className="pawPopup">
              <div className="popupCard">
                <div className="popupTitleRow"><span className={`popupAnimalCode popupAnimalCode--${animal.tone}`}>{animal.code}</span><strong>{animal.label}</strong></div>
                <div className="popupMeta">ประมาณ {point.estimatedCount} ตัว</div>
                <div className="popupMeta">ให้อาหารล่าสุด {relativeTime(point.latestFeedingAt)}</div>
                <Link className="button soft block" href={`/points/${point.id}`}>ดูรายละเอียด</Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
