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
  const [manualPicking, setManualPicking] = useState(false);
  const [positionSource, setPositionSource] = useState(null);
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
    if (!window.isSecureContext) {
      stopTracking();
      setManualPicking(true);
      setError('ไม่สามารถใช้ GPS จากการเชื่อมต่อนี้ได้ เลือกตำแหน่งบนแผนที่แทน หรือเปิดผ่าน HTTPS เพื่อใช้ GPS');
      return;
    }

    if (!navigator.geolocation) {
      setManualPicking(true);
      setError('อุปกรณ์นี้ไม่รองรับ GPS กรุณาเลือกตำแหน่งของคุณบนแผนที่');
      return;
    }

    setManualPicking(false);
    setError('');
    watchRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setUserPosition([coords.latitude, coords.longitude]);
        setAccuracy(Math.round(coords.accuracy));
        setPositionSource('gps');
        setTracking(true);
      },
      () => {
        stopTracking();
        setManualPicking(true);
        setError('ไม่สามารถเข้าถึงตำแหน่งได้ เลือกตำแหน่งของคุณบนแผนที่แทน');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
    setTracking(true);
  }

  function pickManualPosition(position) {
    stopTracking();
    setUserPosition(position);
    setAccuracy(null);
    setPositionSource('manual');
    setManualPicking(false);
    setError('');
    setRecenterKey((value) => value + 1);
  }

  function beginManualPick() {
    stopTracking();
    setManualPicking(true);
    setError('แตะตำแหน่งของคุณบนแผนที่');
  }

  if (loading) return <main className="centerState">กำลังเปิดโหมดนำทาง...</main>;
  if (!point) return <main className="page narrow"><div className="errorBox">{error || 'ไม่พบจุดนี้'}</div><Link href="/" className="button">← กลับแผนที่</Link></main>;

  const destination = [point.latitude, point.longitude];
  const distance = userPosition ? distanceMeters(userPosition, destination) : null;
  const originLabel = userPosition
    ? positionSource === 'manual' ? 'ตำแหน่งที่เลือกบนแผนที่' : 'ตำแหน่งของคุณ'
    : 'ยังไม่ได้ระบุตำแหน่ง';

  return (
    <main className="navExperience">
      <section className="navMapStage" aria-label="แผนที่นำทาง">
        <NavigationMap
          destination={destination}
          userPosition={userPosition}
          accuracy={accuracy}
          recenterKey={recenterKey}
          manualPickEnabled={manualPicking}
          onManualPick={pickManualPosition}
        />

        <div className="navTopBar">
          <Link href={`/points/${id}`} className="navRoundButton" aria-label="กลับรายละเอียดจุด">←</Link>
          <div className="navRouteCard">
            <div className="navRouteRow">
              <span className="navOriginDot" />
              <div><small>ตำแหน่งเริ่มต้น</small><strong>{originLabel}</strong></div>
            </div>
            <span className="navRouteConnector" />
            <div className="navRouteRow">
              <span className="navDestinationPin">●</span>
              <div><small>จุดหมาย</small><strong>{point.description}</strong></div>
            </div>
          </div>
        </div>

        {manualPicking && <div className="navPickHint">แตะบนแผนที่เพื่อเลือกตำแหน่งของคุณ</div>}

        <div className="navMapControls">
          <button className="navMapButton" onClick={() => setRecenterKey((value) => value + 1)} aria-label="จัดแผนที่ให้อยู่กึ่งกลาง">⌖</button>
        </div>
      </section>

      <section className="navBottomSheet" aria-label="ข้อมูลการนำทาง">
        <div className="navSheetHandle" />
        <div className="navSheetHeader">
          <div>
            <span className="eyebrow">PawFeed Navigation</span>
            <h1>นำทางไปยังจุดสัตว์จรจัด</h1>
            <p>นำทางภายในเว็บโดยไม่เปิด Google Maps หรือแอปแผนที่อื่น</p>
          </div>
          <div className="navDistanceSummary">
            <strong>{formatDistance(distance)}</strong>
            <span>ระยะตรง</span>
          </div>
        </div>

        {error && <div className="navInlineNotice" role="status">{error}</div>}

        <div className="navigationStats navCompactStats">
          <div className="navStatItem">
            <small>ระยะตรงโดยประมาณ</small>
            <strong>{formatDistance(distance)}</strong>
          </div>
          <div className="navStatItem">
            <small>{positionSource === 'manual' ? 'ตำแหน่ง' : 'ความแม่นยำ GPS'}</small>
            <strong>{positionSource === 'manual' ? 'เลือกบนแผนที่' : accuracy ? `±${accuracy} ม.` : '—'}</strong>
          </div>
        </div>

        <div className="navPrimaryActions">
          {!tracking ? (
            <button className="navStartButton" onClick={startTracking}>◎ ใช้ตำแหน่งฉัน</button>
          ) : (
            <button className="navStartButton navStopButton" onClick={stopTracking}>■ หยุดติดตาม</button>
          )}
          <button className={`navSecondaryButton ${manualPicking ? 'active' : ''}`} onClick={beginManualPick}>📍 เลือกบนแผนที่</button>
        </div>

        <div className="navPhaseNote">
          ตอนนี้แสดงระยะตรงเพื่อช่วยยืนยันตำแหน่งก่อน เส้นทางตามถนนและเวลาเดินทางจะเพิ่มในขั้นถัดไป
        </div>
      </section>
    </main>
  );
}
