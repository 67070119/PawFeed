'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';

const PawMap = dynamic(() => import('../components/PawMap'), { ssr: false });

export default function HomePage() {
  const { user } = useAuth();
  const [points, setPoints] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userPosition, setUserPosition] = useState(null);

  const loadBounds = useCallback(async (bounds) => {
    setLoading(true); setError('');
    const query = new URLSearchParams(Object.fromEntries(Object.entries(bounds).map(([k,v]) => [k,String(v)])));
    try { setPoints(await api(`/api/points?${query}`)); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  function locate() {
    if (!navigator.geolocation) return setError('Browser นี้ไม่รองรับการอ่านตำแหน่ง');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setUserPosition([coords.latitude, coords.longitude]),
      () => setError('ไม่ได้รับสิทธิ์ตำแหน่ง คุณยังสามารถเลื่อนแผนที่เองได้'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <main className="mapShell">
      <PawMap points={points} onBoundsChange={loadBounds} userPosition={userPosition} />
      <div className="mapSummary" aria-live="polite">
        <span className="mapSummaryDot" aria-hidden="true" />
        <strong>{points.length}</strong>
        <span>จุดในบริเวณนี้</span>
      </div>
      {(loading || error) && <div className={`mapStatus${error ? ' mapStatusError' : ''}`} role="status">{error || 'กำลังอัปเดตจุดในพื้นที่...'}</div>}
      <button className="mapFloatButton mapLocateButton" onClick={locate} aria-label="ตำแหน่งฉัน"><span className="mapLocateGlyph" aria-hidden="true" /></button>
      <Link className="mapAdd" href={user ? '/points/create' : '/login?next=/points/create'}><span>เพิ่มจุดสัตว์จรจัด</span></Link>
    </main>
  );
}
