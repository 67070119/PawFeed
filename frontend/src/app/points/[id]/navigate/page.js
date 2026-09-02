'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../../../lib/api';

const NavigationMap = dynamic(() => import('../../../../components/NavigationMap'), { ssr: false });

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

function formatDistance(meters) {
  if (meters == null) return 'ยังไม่ทราบ';
  if (meters < 1000) return `${Math.round(meters)} เมตร`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} กม.`;
}

export default function NavigatePointPage() {
  const { id } = useParams();
  const [point, setPoint] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [recenterKey, setRecenterKey] = useState(0);
  const watchRef = useRef(null);

  const stopTracking = useCallback(() => {
    if (watchRef.current != null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    setTracking(false);
  }, []);

  useEffect(() => {
    api(`/api/points/${id}`)
      .then(setPoint)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => () => stopTracking(), [stopTracking]);

  function startTracking() {
    if (!navigator.geolocation) {
      setError('Browser นี้ไม่รองรับการอ่านตำแหน่ง คุณยังดูจุดปลายทางบนแผนที่ได้');
      return;
    }

    setError('');
    watchRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setUserPosition([coords.latitude, coords.longitude]);
        setAccuracy(Math.round(coords.accuracy));
        setTracking(true);
      },
      () => {
        stopTracking();
        setError('ไม่ได้รับสิทธิ์ตำแหน่ง คุณยังดูตำแหน่งจุดสัตว์จรจัดบนแผนที่ได้');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
    setTracking(true);
  }

  if (loading) return <main className="centerState">กำลังเปิดโหมดนำทาง...</main>;
  if (!point) return <main className="page narrow"><div className="errorBox">{error || 'ไม่พบจุดนี้'}</div><Link href="/" className="button">← กลับแผนที่</Link></main>;

  const destination = [point.latitude, point.longitude];
  const distance = userPosition ? distanceMeters(userPosition, destination) : null;

  return (
    <main className="navigationShell">
      <section className="navigationMap">
        <NavigationMap destination={destination} userPosition={userPosition} recenterKey={recenterKey} />
      </section>

      <aside className="navigationPanel">
        <div>
          <span className="eyebrow">PawFeed Navigation</span>
          <h1>นำทางไปยังจุดสัตว์จรจัด</h1>
          <p className="muted">นำทางภายในเว็บโดยไม่เปิด Google Maps หรือแอปแผนที่อื่น</p>
        </div>

        {error && <div className="warningBox">{error}</div>}

        <div className="navigationStats">
          <div className="stat"><small>ระยะตรงโดยประมาณ</small><strong>{formatDistance(distance)}</strong></div>
          <div className="stat"><small>ความแม่นยำ GPS</small><strong>{accuracy ? `±${accuracy} ม.` : '—'}</strong></div>
        </div>

        <div className="card navigationTarget">
          <strong>🐾 จุดหมาย</strong>
          <p>{point.description}</p>
          <small>{point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}</small>
        </div>

        <div className="sectionActions">
          {!tracking ? (
            <button className="button primary" onClick={startTracking}>◎ ใช้ตำแหน่งฉัน</button>
          ) : (
            <button className="button danger" onClick={stopTracking}>หยุดติดตามตำแหน่ง</button>
          )}
          <button className="button" onClick={() => setRecenterKey((value) => value + 1)}>⌖ จัดแผนที่ให้อยู่กึ่งกลาง</button>
        </div>

        <div className="warningBox">
          เส้นประแสดงระยะตรงระหว่างตำแหน่งของคุณกับจุดหมาย ไม่ใช่เส้นทางถนนหรือคำสั่งเลี้ยวแบบ turn-by-turn
        </div>

        <Link href={`/points/${id}`} className="button block">← กลับรายละเอียดจุด</Link>
      </aside>
    </main>
  );
}
