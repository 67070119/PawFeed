'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import RadiusFilter from '../components/RadiusFilter';
import { api } from '../lib/api';

const PawMap = dynamic(() => import('../components/PawMap'), { ssr: false });
const DEFAULT_RADIUS_KM = 2;
const RADIUS_DEBOUNCE_MS = 260;

function distanceMeters(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earth = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(h));
}

function radiusBounds(position, radiusKm) {
  const [latitude, longitude] = position;
  const latDelta = radiusKm / 111.32;
  const lngScale = Math.max(0.2, Math.cos((latitude * Math.PI) / 180));
  const lngDelta = radiusKm / (111.32 * lngScale);
  return {
    minLat: latitude - latDelta,
    maxLat: latitude + latDelta,
    minLng: longitude - lngDelta,
    maxLng: longitude + lngDelta,
  };
}

export default function HomePage() {
  const [points, setPoints] = useState([]);
  const [dataError, setDataError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [locating, setLocating] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [appliedRadiusKm, setAppliedRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const lastBoundsRef = useRef(null);

  const loadBounds = useCallback(async (bounds) => {
    if (userPosition) return;
    lastBoundsRef.current = bounds;
    setLoading(true);
    setDataError('');
    const query = new URLSearchParams(Object.fromEntries(Object.entries(bounds).map(([key, value]) => [key, String(value)])));
    try {
      setPoints(await api(`/api/points?${query}`));
      setHasLoaded(true);
    } catch (err) {
      setDataError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userPosition]);

  const loadRadius = useCallback(async (position, radius) => {
    const bounds = radiusBounds(position, radius);
    const query = new URLSearchParams(Object.fromEntries(Object.entries(bounds).map(([key, value]) => [key, String(value)])));
    setLoading(true);
    setDataError('');
    try {
      const candidates = await api(`/api/points?${query}`);
      const maxDistance = radius * 1000;
      setPoints(candidates.filter((point) => distanceMeters(position, [Number(point.latitude), Number(point.longitude)]) <= maxDistance));
      setHasLoaded(true);
    } catch (err) {
      setDataError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('เบราว์เซอร์นี้ไม่รองรับการอ่านตำแหน่ง คุณยังสามารถเลื่อนแผนที่เพื่อค้นหาได้');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserPosition([coords.latitude, coords.longitude]);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocationError('ยังใช้ตำแหน่งปัจจุบันไม่ได้ คุณสามารถเลื่อนแผนที่เองหรือลองอนุญาตตำแหน่งอีกครั้ง');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
  }, []);

  const retryData = useCallback(() => {
    if (userPosition) {
      loadRadius(userPosition, appliedRadiusKm);
      return;
    }
    if (lastBoundsRef.current) loadBounds(lastBoundsRef.current);
  }, [userPosition, appliedRadiusKm, loadRadius, loadBounds]);

  useEffect(() => { locate(); }, [locate]);

  useEffect(() => {
    const timer = setTimeout(() => setAppliedRadiusKm(radiusKm), RADIUS_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [radiusKm]);

  useEffect(() => {
    if (userPosition) loadRadius(userPosition, appliedRadiusKm);
  }, [userPosition, appliedRadiusKm, loadRadius]);

  const emptyMessage = hasLoaded && !loading && !dataError && points.length === 0
    ? (userPosition ? 'ยังไม่พบจุดในรัศมีนี้ ลองเพิ่มระยะค้นหา' : 'ยังไม่พบจุดในบริเวณนี้ ลองเลื่อนหรือซูมแผนที่')
    : '';

  return (
    <main className="mapShell" aria-label="แผนที่จุดสัตว์จรจัด">
      <h1 className="visuallyHidden">แผนที่จุดสัตว์จรจัด PawFeed</h1>
      <PawMap
        points={points}
        onBoundsChange={loadBounds}
        userPosition={userPosition}
        radiusMeters={userPosition ? radiusKm * 1000 : null}
        focusRadiusMeters={userPosition ? appliedRadiusKm * 1000 : null}
      />

      <div className="mapSummary" aria-live="polite">
        <span className="mapSummaryDot" aria-hidden="true" />
        <strong>{points.length}</strong>
        <span>{userPosition ? 'จุดในรัศมี' : 'จุดในบริเวณนี้'}</span>
      </div>

      <div className="mapStatusStack" aria-live="polite">
        {loading && (
          <div className="mapStatus mapStatusLoading" role="status">
            <span className="mapStatusSpinner" aria-hidden="true" />
            <span>กำลังอัปเดตจุดในพื้นที่...</span>
          </div>
        )}

        {!loading && dataError && (
          <div className="mapStatus mapStatusError" role="alert">
            <span>{dataError}</span>
            <button type="button" className="mapStatusAction" onClick={retryData}>ลองอีกครั้ง</button>
          </div>
        )}

        {!loading && !dataError && locationError && (
          <div className="mapStatus mapStatusWarning" role="status">
            <span>{locationError}</span>
            <button type="button" className="mapStatusAction" onClick={locate}>ลองตำแหน่งอีกครั้ง</button>
          </div>
        )}

        {emptyMessage && !locationError && (
          <div className="mapStatus mapStatusEmpty" role="status">{emptyMessage}</div>
        )}
      </div>

      <button
        type="button"
        className={`mapFloatButton mapLocateButton${userPosition ? ' isLocated' : ''}`}
        onClick={locate}
        aria-label={userPosition ? 'อัปเดตตำแหน่งปัจจุบัน' : 'ใช้ตำแหน่งปัจจุบัน'}
        title={userPosition ? 'อัปเดตตำแหน่งปัจจุบัน' : 'ใช้ตำแหน่งปัจจุบัน'}
        disabled={locating}
      >
        <span className="mapLocateGlyph" aria-hidden="true" />
      </button>

      <RadiusFilter
        value={radiusKm}
        onChange={setRadiusKm}
        disabled={!userPosition}
        locating={locating}
        onLocate={locate}
      />
    </main>
  );
}
