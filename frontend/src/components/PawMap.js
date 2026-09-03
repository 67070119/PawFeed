'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { relativeTime } from '../lib/api';

const KMITL = [13.7291, 100.7789];
const ANIMALS = {
  DOG: { label: 'สุนัขจรจัด', tone: 'dog' },
  CAT: { label: 'แมวจรจัด', tone: 'cat' },
  OTHER: { label: 'สัตว์จรจัด', tone: 'other' },
};

function animalIcon(animalType, selected = false) {
  const item = ANIMALS[animalType] || ANIMALS.OTHER;
  return L.divIcon({
    className: 'mapMarkerHost',
    html: `<div class="mapAnimalMarker mapAnimalMarker--${item.tone}${selected ? ' isSelected' : ''}"><span class="mapAnimalGlyph"><i></i></span><b></b></div>`,
    iconSize: [48, 56], iconAnchor: [24, 52], popupAnchor: [0, -48],
  });
}

const userIcon = L.divIcon({
  className: 'mapMarkerHost',
  html: '<div class="mapUserMarker"><span class="mapUserMarkerPulse"></span><span class="mapUserMarkerDot"></span></div>',
  iconSize: [36, 36], iconAnchor: [18, 18],
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
  return <Marker position={position} icon={userIcon} zIndexOffset={900} interactive={false} />;
}

export default function PawMap({ points, onBoundsChange, userPosition }) {
  const [selectedId, setSelectedId] = useState(null);
  return (
    <MapContainer center={KMITL} zoom={14} className="mapCanvas pawMapCanvas" scrollWheelZoom zoomControl={false}>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ZoomControl position="bottomright" />
      <BoundsWatcher onBoundsChange={onBoundsChange} />
      <LocateUser position={userPosition} />
      {points.map((point) => {
        const animal = ANIMALS[point.animalType] || ANIMALS.OTHER;
        const selected = selectedId === point.id;
        return <Marker key={point.id} position={[point.latitude, point.longitude]} icon={animalIcon(point.animalType, selected)} zIndexOffset={selected ? 500 : 0} eventHandlers={{ click: () => setSelectedId(point.id), popupclose: () => setSelectedId(null) }}>
          <Popup className="pawPopup" closeButton={false} minWidth={238}>
            <div className="popupCard">
              <div className="popupTypeRow"><span className={`popupAnimalIcon popupAnimalIcon--${animal.tone}`}><i /></span><span>{animal.label}</span></div>
              <strong className="popupHeadline">ประมาณ {point.estimatedCount} ตัว</strong>
              <div className="popupData"><span>ให้อาหารล่าสุด</span><strong>{relativeTime(point.latestFeedingAt)}</strong></div>
              <Link className="popupAction" href={`/points/${point.id}`}>ดูรายละเอียด <span aria-hidden="true">→</span></Link>
            </div>
          </Popup>
        </Marker>;
      })}
    </MapContainer>
  );
}
