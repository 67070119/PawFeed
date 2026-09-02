'use client';

import { useEffect } from 'react';
import { Circle, CircleMarker, MapContainer, Pane, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';

function ViewController({ destination, userPosition, routeGeometry, recenterKey, activeNavigation, followUser }) {
  const map = useMap();

  useEffect(() => {
    if (activeNavigation) {
      if (followUser && userPosition) {
        map.setView(userPosition, Math.max(map.getZoom(), 17), { animate: true });
      }
      return;
    }
    if (routeGeometry?.length > 1) {
      map.fitBounds(routeGeometry, { paddingTopLeft: [48, 120], paddingBottomRight: [48, 260], maxZoom: 17 });
      return;
    }
    if (userPosition) {
      map.fitBounds([userPosition, destination], { paddingTopLeft: [48, 120], paddingBottomRight: [48, 260], maxZoom: 17 });
      return;
    }
    map.setView(destination, 16);
  }, [map, destination, userPosition, routeGeometry, recenterKey, activeNavigation, followUser]);

  return null;
}

function MapInteractionController({ manualPickEnabled, onManualPick, activeNavigation, onUserMapInteraction }) {
  useMapEvents({
    click(event) {
      if (!manualPickEnabled) return;
      onManualPick([event.latlng.lat, event.latlng.lng]);
    },
    dragstart() {
      if (activeNavigation) onUserMapInteraction?.();
    },
  });
  return null;
}

export default function NavigationMap({
  destination,
  userPosition,
  accuracy,
  routeGeometry = [],
  recenterKey = 0,
  manualPickEnabled = false,
  onManualPick,
  activeNavigation = false,
  followUser = false,
  onUserMapInteraction,
}) {
  const fallbackLine = userPosition && routeGeometry.length < 2 ? [userPosition, destination] : null;

  return (
    <MapContainer center={destination} zoom={16} className={`navigationMapCanvas${manualPickEnabled ? ' manualPickActive' : ''}${activeNavigation ? ' activeNavigationMap' : ''}`} scrollWheelZoom zoomControl={false}>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ViewController
        destination={destination}
        userPosition={userPosition}
        routeGeometry={routeGeometry}
        recenterKey={recenterKey}
        activeNavigation={activeNavigation}
        followUser={followUser}
      />
      <MapInteractionController
        manualPickEnabled={manualPickEnabled}
        onManualPick={onManualPick}
        activeNavigation={activeNavigation}
        onUserMapInteraction={onUserMapInteraction}
      />

      {routeGeometry.length > 1 && (
        <Pane name="route-preview" className="navigation-road-route" style={{ zIndex: 430 }}>
          <Polyline positions={routeGeometry} pathOptions={{ color: '#ffffff', weight: activeNavigation ? 11 : 10, opacity: 0.92 }} />
          <Polyline positions={routeGeometry} pathOptions={{ color: '#16866f', weight: activeNavigation ? 7 : 6, opacity: 0.98 }} />
        </Pane>
      )}

      {fallbackLine && (
        <Pane name="direct-fallback" className="navigation-direct-fallback" style={{ zIndex: 420 }}>
          <Polyline positions={fallbackLine} pathOptions={{ color: '#62746f', weight: 4, dashArray: '8 9', opacity: 0.75 }} />
        </Pane>
      )}

      <CircleMarker center={destination} radius={12} pathOptions={{ color: '#9f3434', fillColor: '#c94747', fillOpacity: 0.95, weight: 3 }}>
        <Tooltip permanent direction="top" offset={[0, -10]}>จุดสัตว์จรจัด</Tooltip>
      </CircleMarker>

      {userPosition && (
        <>
          {accuracy && <Circle center={userPosition} radius={accuracy} pathOptions={{ color: '#2f80ed', fillColor: '#2f80ed', fillOpacity: 0.08, weight: 1 }} />}
          <CircleMarker center={userPosition} radius={activeNavigation ? 11 : 10} pathOptions={{ color: '#ffffff', fillColor: '#2f80ed', fillOpacity: 1, weight: 4 }}>
            <Tooltip permanent={!activeNavigation} direction="top" offset={[0, -9]}>ตำแหน่งฉัน</Tooltip>
          </CircleMarker>
        </>
      )}
    </MapContainer>
  );
}
