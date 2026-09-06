'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [appliedRadiusKm, setAppliedRadiusKm] = useState(DEFAULT_RADIUS_KM);

  const loadBounds = useCallback(async (bounds) => {
    if (userPosition) return;
    setLoading(true);
    setError('');
    const query = new URLSearchParams(Object.fromEntries(Object.entries(bounds).map(([key, value]) => [key, String(value)])));
    try {
      setPoints(await api(`/api/points?${query}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userPosition]);

  const loadRadius = useCallback(async (position, radius) => {
    const bounds = radiusBounds(position, radius);
    const query = new URLSearchParams(Object.fromEntries(Object.entries(bounds).map(([key, value]) => [key, String(value)])));
    setLoading(true);
    setError('');
    try {
      const candidates = await api(`/api/points?${query}`);
      const maxDistance = radius * 1000;
      setPoints(candidates.filter((point) => distanceMeters(position, [Number(point.latitude), Number(point.longitude)]) <= maxDistance));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Browser นี้ไม่รองรับการอ่านตำแหน่ง');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserPosition([coords.latitude, coords.longitude]);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError('ไม่ได้รับสิทธิ์ตำแหน่ง คุณยังสามารถเลื่อนแผนที่เองได้');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
  }, []);

  useEffect(() => { locate(); }, [locate]);

  useEffect(() => {
    const timer = setTimeout(() => setAppliedRadiusKm(radiusKm), RADIUS_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [radiusKm]);

  useEffect(() => {
    if (userPosition) loadRadius(userPosition, appliedRadiusKm);
  }, [userPosition, appliedRadiusKm, loadRadius]);

  return (
    <main className="mapShell">
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
      {(loading || error) && <div className={`mapStatus${error ? ' mapStatusError' : ''}`} role="status">{error || 'กำลังอัปเดตจุดในพื้นที่...'}</div>}
      <button className="mapFloatButton mapLocateButton" onClick={locate} aria-label="ตำแหน่งฉัน" disabled={locating}><span className="mapLocateGlyph" aria-hidden="true" /></button>
      <RadiusFilter value={radiusKm} onChange={setRadiusKm} disabled={!userPosition} locating={locating} />
    </main>
  );
}
