'use client';

import { useEffect, useState } from 'react';
import { Circle, CircleMarker, MapContainer, Pane, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function ViewController({ destination, userPosition, routeGeometry, recenterKey, activeNavigation, followUser }) {
  const map = useMap();
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));

  useEffect(() => {
    let frame;
    function syncViewport() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        map.invalidateSize({ animate: false });
        setViewport({ width: window.innerWidth, height: window.innerHeight });
      });
    }
    window.addEventListener('resize', syncViewport);
    return () => {
      window.removeEventListener('resize', syncViewport);
      cancelAnimationFrame(frame);
    };
  }, [map]);

  useEffect(() => {
    const reduceMotion = prefersReducedMotion();

    if (activeNavigation) {
      if (followUser && userPosition) {
        map.setView(userPosition, Math.max(map.getZoom(), 17), { animate: !reduceMotion });
      }
      return;
    }

    const landscapePanel = viewport.width >= 620 && viewport.height <= 540 && viewport.width > viewport.height;
    const paddingTopLeft = landscapePanel ? [64, 90] : [48, 110];
    const paddingBottomRight = landscapePanel
      ? [Math.min(420, Math.round(viewport.width * 0.48)), 48]
      : [48, Math.min(340, Math.max(220, Math.round(viewport.height * 0.36)))];

    if (routeGeometry?.length > 1) {
      map.fitBounds(routeGeometry, {
        paddingTopLeft,
        paddingBottomRight,
        maxZoom: 17,
        animate: !reduceMotion,
      });
      return;
    }
    if (userPosition) {
      map.fitBounds([userPosition, destination], {
        paddingTopLeft,
        paddingBottomRight,
        maxZoom: 17,
        animate: !reduceMotion,
      });
      return;
    }
    map.setView(destination, 16, { animate: !reduceMotion });
  }, [map, destination, userPosition, routeGeometry, recenterKey, activeNavigation, followUser, viewport.width, viewport.height]);

  return null;
}
function MapInteractionController({ manualPickEnabled, onManualPick, activeNavigation, onUserMapInteraction }) {
  useMapEvents({
    click(event) {
      if (!manualPickEnabled) return;
      onManualPick?.([event.latlng.lat, event.latlng.lng]);
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
  showDirectFallback = false,
  positionLabel = 'ตำแหน่งฉัน',
}) {
  const fallbackLine = showDirectFallback && userPosition ? [userPosition, destination] : null;

  return (
    <MapContainer
      center={destination}
      zoom={16}
      className={`navigationMapCanvas${manualPickEnabled ? ' manualPickActive' : ''}${activeNavigation ? ' activeNavigationMap' : ''}`}
      scrollWheelZoom
      zoomControl={false}
    >
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
          <Polyline positions={routeGeometry} pathOptions={{ color: '#49382c', weight: activeNavigation ? 12 : 11, opacity: 0.78 }} />
          <Polyline positions={routeGeometry} pathOptions={{ color: '#c49363', weight: activeNavigation ? 6 : 5, opacity: 1 }} />
        </Pane>
      )}

      {fallbackLine && (
        <Pane name="direct-fallback" className="navigation-direct-fallback" style={{ zIndex: 420 }}>
          <Polyline positions={fallbackLine} pathOptions={{ color: '#aaa198', weight: 3, dashArray: '8 9', opacity: 0.82 }} />
        </Pane>
      )}

      <CircleMarker center={destination} radius={12} pathOptions={{ color: '#f2eee7', fillColor: '#c49363', fillOpacity: 0.95, weight: 3 }}>
        <Tooltip permanent direction="top" offset={[0, -10]}>จุดสัตว์จรจัด</Tooltip>
      </CircleMarker>

      {userPosition && (
        <>
          {accuracy && <Circle center={userPosition} radius={accuracy} pathOptions={{ color: '#c49363', fillColor: '#c49363', fillOpacity: 0.08, weight: 1 }} />}
          <CircleMarker center={userPosition} radius={activeNavigation ? 11 : 10} pathOptions={{ color: '#17191b', fillColor: '#f1eee8', fillOpacity: 1, weight: 4 }}>
            <Tooltip permanent={!activeNavigation} direction="top" offset={[0, -9]}>
              {positionLabel}
            </Tooltip>
          </CircleMarker>
        </>
      )}
    </MapContainer>
  );
}
