'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Circle, MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { ArrowRightOutlined } from '@ant-design/icons';
import AnimalIcon, { getAnimalSvgString } from './AnimalIcon';
import { relativeTime } from '../lib/api';

const KMITL = [13.7291, 100.7789];
const WORLD_BOUNDS = [[-85, -180], [85, 180]];
const ANIMALS = {
  DOG: { label: 'สุนัขจรจัด', tone: 'dog' },
  CAT: { label: 'แมวจรจัด', tone: 'cat' },
  OTHER: { label: 'สัตว์จรจัด', tone: 'other' },
};

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function animalIcon(type, selected = false) {
  const item = ANIMALS[type] || ANIMALS.OTHER;
  const svgHtml = getAnimalSvgString(type);
  return L.divIcon({
    className: 'mapMarkerHost',
    html: `<div class="mapAnimalMarker mapAnimalMarker--${item.tone}${selected ? ' isSelected' : ''}"><span class="mapAnimalIconWrap" aria-hidden="true">${svgHtml}</span><b></b></div>`,
    iconSize: [50, 58],
    iconAnchor: [25, 53],
    popupAnchor: [0, -50],
  });
}

const userIcon = L.divIcon({
  className: 'mapMarkerHost',
  html: '<div class="mapUserMarker"><span class="mapUserMarkerPulse"></span><span class="mapUserMarkerDot"></span></div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function BoundsWatcher({ onBoundsChange, enabled }) {
  const map = useMapEvents({ moveend: emit, zoomend: emit });

  function emit() {
    if (!enabled) return;
    const bounds = map.getBounds();
    onBoundsChange({
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLng: bounds.getWest(),
      maxLng: bounds.getEast(),
    });
  }

  useEffect(() => { emit(); }, [enabled]);
  return null;
}

function LocateUser({ position }) {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    map.setView(position, Math.max(map.getZoom(), 15), { animate: !prefersReducedMotion() });
  }, [position, map]);
  if (!position) return null;
  return <Marker position={position} icon={userIcon} zIndexOffset={900} interactive={false} />;
}

function RadiusViewport({ center, radiusMeters }) {
  const map = useMap();

  useEffect(() => {
    if (!center || !radiusMeters) return;
    const [latitude, longitude] = center;
    const radiusKm = radiusMeters / 1000;
    const latDelta = radiusKm / 111.32;
    const lngScale = Math.max(0.2, Math.cos((latitude * Math.PI) / 180));
    const lngDelta = radiusKm / (111.32 * lngScale);
    const bounds = [
      [latitude - latDelta, longitude - lngDelta],
      [latitude + latDelta, longitude + lngDelta],
    ];
    const reduceMotion = prefersReducedMotion();
    map.flyToBounds(bounds, {
      animate: !reduceMotion,
      duration: reduceMotion ? 0 : 0.42,
      maxZoom: 16,
      paddingTopLeft: [44, 110],
      paddingBottomRight: [44, 110],
    });
  }, [center, radiusMeters, map]);

  return null;
}

export default function PawMap({ points, onBoundsChange, userPosition, radiusMeters, focusRadiusMeters }) {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <MapContainer
      center={KMITL}
      zoom={14}
      minZoom={3}
      maxBounds={WORLD_BOUNDS}
      maxBoundsViscosity={1}
      className="mapCanvas pawMapCanvas"
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        noWrap
      />
      <BoundsWatcher onBoundsChange={onBoundsChange} enabled={!userPosition} />
      <LocateUser position={userPosition} />
      <RadiusViewport center={userPosition} radiusMeters={focusRadiusMeters} />
      {!selectedId && <ZoomControl position="bottomright" />}
      {userPosition && radiusMeters && (
        <Circle
          center={userPosition}
          radius={radiusMeters}
          interactive={false}
          className="mapRadiusCircle"
          pathOptions={{ color: '#d29a61', weight: 2, opacity: 0.72, fillColor: '#d29a61', fillOpacity: 0.07 }}
        />
      )}
      {points.map((point) => {
        const animalBase = ANIMALS[point.animalType] || ANIMALS.OTHER;
        let animalLabel = animalBase.label;
        let cleanDesc = point.description || '';
        if (point.animalType === 'OTHER' && cleanDesc) {
          const match = cleanDesc.match(/^\[ชนิดสัตว์:\s*([^\]]+)\]\s*\n*/);
          if (match) {
            animalLabel = match[1].trim();
            cleanDesc = cleanDesc.replace(/^\[ชนิดสัตว์:\s*([^\]]+)\]\s*\n*/, '');
          }
        }
        const animal = { ...animalBase, label: animalLabel };
        const selected = selectedId === point.id;
        const markerLabel = `${animal.label} ประมาณ ${point.estimatedCount} ตัว`;
        return (
          <Marker
            key={point.id}
            position={[point.latitude, point.longitude]}
            icon={animalIcon(point.animalType, selected)}
            zIndexOffset={selected ? 500 : 0}
            keyboard
            title={markerLabel}
            eventHandlers={{ click: () => setSelectedId(point.id), popupclose: () => setSelectedId(null) }}
          >
            <Popup
              className="pawPopup"
              closeButton
              minWidth={200}
              keepInView
              autoPanPaddingTopLeft={[16, 96]}
              autoPanPaddingBottomRight={[16, 156]}
            >
              <div className="popupCard">
                <div className="popupTypeRow">
                  <span className={`popupAnimalIcon popupAnimalIcon--${animal.tone}`} aria-hidden="true">
                    <AnimalIcon type={point.animalType} size={18} />
                  </span>
                  <span>{animal.label}</span>
                </div>
                <strong className="popupHeadline">ประมาณ {point.estimatedCount} ตัว</strong>
                {cleanDesc && <p className="popupDescription">{cleanDesc}</p>}
                <div className="popupMetaGrid">
                  <div className="popupData"><span>พบล่าสุด</span><strong>{relativeTime(point.lastSeenAt)}</strong></div>
                  <div className="popupData"><span>ให้อาหารล่าสุด</span><strong>{relativeTime(point.latestFeedingAt)}</strong></div>
                </div>
                <Link className="popupAction" href={`/points/${point.id}`} aria-label={`ดูรายละเอียด ${markerLabel}`}>
                  <span>ดูรายละเอียด</span>
                  <ArrowRightOutlined aria-hidden="true" />
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
