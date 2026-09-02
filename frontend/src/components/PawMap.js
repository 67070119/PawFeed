'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { relativeTime } from '../lib/api';

const KMITL = [13.7291, 100.7789];

function icon(animalType) {
  const emoji = animalType === 'DOG' ? '🐶' : animalType === 'CAT' ? '🐱' : '🐾';
  return L.divIcon({
    className: '',
    html: `<div style="width:44px;height:44px;border-radius:15px 15px 15px 5px;transform:rotate(-45deg);background:white;border:2px solid rgba(22,134,111,.28);box-shadow:0 8px 20px rgba(22,64,54,.18);display:grid;place-items:center"><span style="transform:rotate(45deg);font-size:20px">${emoji}</span></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
  });
}

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
  useEffect(() => { if (position) map.setView(position, Math.max(map.getZoom(), 15)); }, [position, map]);
  if (!position) return null;
  return <Marker position={position} icon={L.divIcon({ className:'', html:'<div style="width:18px;height:18px;background:#2778df;border:4px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(39,120,223,.18)"></div>', iconSize:[18,18], iconAnchor:[9,9] })} />;
}

export default function PawMap({ points, onBoundsChange, userPosition }) {
  return (
    <MapContainer center={KMITL} zoom={14} className="mapCanvas" scrollWheelZoom>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <BoundsWatcher onBoundsChange={onBoundsChange} />
      <LocateUser position={userPosition} />
      {points.map((point) => (
        <Marker key={point.id} position={[point.latitude, point.longitude]} icon={icon(point.animalType)}>
          <Popup>
            <div className="popupCard">
              <strong>{point.animalType === 'DOG' ? '🐶 สุนัขจรจัด' : point.animalType === 'CAT' ? '🐱 แมวจรจัด' : '🐾 สัตว์จรจัด'}</strong>
              <div className="popupMeta">ประมาณ {point.estimatedCount} ตัว · ให้อาหารล่าสุด {relativeTime(point.latestFeedingAt)}</div>
              <Link className="button soft block" href={`/points/${point.id}`}>ดูรายละเอียด</Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
