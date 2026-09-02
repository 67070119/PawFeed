'use client';

import { useEffect } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';

function ViewController({ destination, userPosition, recenterKey }) {
  const map = useMap();

  useEffect(() => {
    if (userPosition) {
      map.fitBounds([userPosition, destination], { padding: [48, 48], maxZoom: 17 });
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

export default function NavigationMap({ destination, userPosition, recenterKey = 0, manualPickEnabled = false, onManualPick }) {
  const route = userPosition ? [userPosition, destination] : null;

  return (
    <MapContainer center={destination} zoom={16} className={`navigationMapCanvas${manualPickEnabled ? ' manualPickActive' : ''}`} scrollWheelZoom>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ViewController destination={destination} userPosition={userPosition} recenterKey={recenterKey} />
      <ManualPositionPicker enabled={manualPickEnabled} onPick={onManualPick} />

      <CircleMarker center={destination} radius={12} pathOptions={{ color: '#b94747', fillColor: '#b94747', fillOpacity: 0.9 }}>
        <Tooltip permanent direction="top" offset={[0, -10]}>จุดสัตว์จรจัด</Tooltip>
      </CircleMarker>

      {userPosition && (
        <>
          <Polyline positions={route} pathOptions={{ color: '#16866f', weight: 4, dashArray: '8 8' }} />
          <CircleMarker center={userPosition} radius={10} pathOptions={{ color: '#2778df', fillColor: '#2778df', fillOpacity: 0.9 }}>
            <Tooltip permanent direction="top" offset={[0, -9]}>ตำแหน่งฉัน</Tooltip>
          </CircleMarker>
        </>
      )}
    </MapContainer>
  );
}
