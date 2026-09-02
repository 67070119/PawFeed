'use client';

import { useEffect } from 'react';
import { Circle, CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';

function ViewController({ destination, userPosition, recenterKey }) {
  const map = useMap();

  useEffect(() => {
    if (userPosition) {
      map.fitBounds([userPosition, destination], {
        paddingTopLeft: [36, 160],
        paddingBottomRight: [36, 280],
        maxZoom: 15,
      });
      return;
    }
    map.setView(destination, 16);
  }, [map, destination, userPosition, recenterKey]);

  return null;
}

function ManualPositionPicker({ enabled, onPick }) {
  useMapEvents({
    click(event) {
      if (!enabled) return;
      onPick([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

export default function NavigationMap({
  destination,
  userPosition,
  accuracy,
  recenterKey = 0,
  manualPickEnabled = false,
  onManualPick,
}) {
  const route = userPosition ? [userPosition, destination] : null;

  return (
    <MapContainer
      center={destination}
      zoom={16}
      zoomControl={false}
      className={`navigationMapCanvas${manualPickEnabled ? ' manualPickActive' : ''}`}
      scrollWheelZoom
    >
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ViewController destination={destination} userPosition={userPosition} recenterKey={recenterKey} />
      <ManualPositionPicker enabled={manualPickEnabled} onPick={onManualPick} />

      <CircleMarker center={destination} radius={13} pathOptions={{ color: '#ffffff', weight: 4, fillColor: '#c94747', fillOpacity: 1 }}>
        <Tooltip permanent direction="top" offset={[0, -12]}>จุดสัตว์จรจัด</Tooltip>
      </CircleMarker>

      {userPosition && (
        <>
          <Polyline positions={route} pathOptions={{ color: '#16866f', weight: 5, dashArray: '10 10', opacity: 0.92 }} />
          {accuracy && <Circle center={userPosition} radius={accuracy} pathOptions={{ color: '#4d8fe8', weight: 1, fillColor: '#4d8fe8', fillOpacity: 0.12 }} />}
          <CircleMarker center={userPosition} radius={10} pathOptions={{ color: '#ffffff', weight: 4, fillColor: '#2f80ed', fillOpacity: 1 }}>
            <Tooltip permanent direction="top" offset={[0, -10]}>ตำแหน่งฉัน</Tooltip>
          </CircleMarker>
        </>
      )}
    </MapContainer>
  );
}
