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
      <div className="mapOverlay">
        <div className="mapInfo"><span className="mapInfoEyebrow">PAWFEED MAP</span><strong>จุดสัตว์จรจัดในพื้นที่</strong><span>{loading ? 'กำลังโหลด...' : `${points.length} จุดในบริเวณที่แสดง`}</span>{error && <div className="errorBox">{error}</div>}</div>
        <button className="button mapLocateButton" onClick={locate}>ตำแหน่งของฉัน</button>
      </div>
      <Link className="button primary mapAdd" href={user ? '/points/create' : '/login?next=/points/create'}>เพิ่มจุดสัตว์จรจัด</Link>
    </main>
  );
}
