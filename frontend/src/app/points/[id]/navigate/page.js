'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../../../lib/api';

const NavigationMap = dynamic(() => import('../../../../components/NavigationMap'), { ssr: false });

const MODE_OPTIONS = [
  { value: 'DRIVING', icon: '🚗', label: 'รถ' },
  { value: 'WALKING', icon: '🚶', label: 'เดิน' },
  { value: 'CYCLING', icon: '🚲', label: 'จักรยาน' },
];

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
  if (meters < 1000) return `${Math.round(meters)} ม.`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} กม.`;
}

function formatDuration(seconds) {
  if (seconds == null) return '—';
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} นาที`;
  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;
  return remain ? `${hours} ชม. ${remain} นาที` : `${hours} ชม.`;
}

function routingErrorMessage(error) {
  if (error?.code === 'NAVIGATION_ROUTE_NOT_FOUND') return 'ไม่พบเส้นทางที่เหมาะสมสำหรับโหมดนี้';
  if (error?.code === 'ROUTING_TIMEOUT') return 'คำนวณเส้นทางใช้เวลานานเกินไป กรุณาลองใหม่';
  return 'คำนวณเส้นทางตามถนนไม่ได้ในขณะนี้ จะแสดงระยะตรงชั่วคราว';
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
  const [travelMode, setTravelMode] = useState('DRIVING');
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const watchRef = useRef(null);
  const routeRequestRef = useRef(0);
  const routeOriginRef = useRef(null);
  const routeModeRef = useRef(null);

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

  useEffect(() => {
    if (!point || !userPosition) {
      setRoute(null);
      setRouteError('');
      return;
    }

    const lastOrigin = routeOriginRef.current;
    const canReuse = lastOrigin
      && routeModeRef.current === travelMode
      && distanceMeters(lastOrigin, userPosition) < 50;
    if (canReuse) return;

    const requestId = ++routeRequestRef.current;
    setRouteLoading(true);
    setRouteError('');

    const params = new URLSearchParams({
      originLat: String(userPosition[0]),
      originLng: String(userPosition[1]),
      destinationLat: String(point.latitude),
      destinationLng: String(point.longitude),
      mode: travelMode,
    });

    api(`/api/navigation/route?${params}`)
      .then((data) => {
        if (routeRequestRef.current !== requestId) return;
        setRoute(data);
        routeOriginRef.current = userPosition;
        routeModeRef.current = travelMode;
      })
      .catch((err) => {
        if (routeRequestRef.current !== requestId) return;
        setRoute(null);
        setRouteError(routingErrorMessage(err));
      })
      .finally(() => {
        if (routeRequestRef.current === requestId) setRouteLoading(false);
      });
  }, [point, userPosition, travelMode]);

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
    routeOriginRef.current = null;
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

  function selectTravelMode(mode) {
    if (mode === travelMode) return;
    routeOriginRef.current = null;
    setTravelMode(mode);
    setRoute(null);
  }

  if (loading) return <main className="centerState">กำลังเปิดโหมดนำทาง...</main>;
  if (!point) return <main className="page narrow"><div className="errorBox">{error || 'ไม่พบจุดนี้'}</div><Link href="/" className="button">← กลับแผนที่</Link></main>;

  const destination = [point.latitude, point.longitude];
  const directDistance = userPosition ? distanceMeters(userPosition, destination) : null;
  const displayDistance = route?.distanceMeters ?? directDistance;
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
          routeGeometry={route?.geometry ?? []}
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

        <div className="navModeTabs" aria-label="เลือกโหมดเดินทาง">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`navModeTab ${travelMode === option.value ? 'active' : ''}`}
              onClick={() => selectTravelMode(option.value)}
              aria-pressed={travelMode === option.value}
            >
              <span>{option.icon}</span>{option.label}
            </button>
          ))}
        </div>

        <div className="navSheetHeader">
          <div>
            <span className="eyebrow">Route Preview</span>
            <h1>{routeLoading ? 'กำลังหาเส้นทาง...' : route ? formatDuration(route.durationSeconds) : 'เลือกตำแหน่งเริ่มต้น'}</h1>
            <p>{route ? `เส้นทางตามถนน · ${route.provider}` : 'ระบุตำแหน่งเพื่อคำนวณเส้นทางตามถนน'}</p>
          </div>
          <div className="navDistanceSummary">
            <strong>{formatDistance(displayDistance)}</strong>
            <span>{route ? 'ตามเส้นทาง' : 'ระยะตรง'}</span>
          </div>
        </div>

        {error && <div className="navInlineNotice" role="status">{error}</div>}
        {routeError && <div className="navInlineNotice routeErrorNotice" role="status">{routeError}</div>}

        <div className="navCompactStats">
          <div className="navStatItem">
            <small>เวลาโดยประมาณ</small>
            <strong>{routeLoading ? 'กำลังคำนวณ' : formatDuration(route?.durationSeconds)}</strong>
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
            <button className="navStartButton navStopButton" onClick={stopTracking}>■ หยุดอัปเดต GPS</button>
          )}
          <button className={`navSecondaryButton ${manualPicking ? 'active' : ''}`} onClick={beginManualPick}>📍 เลือกบนแผนที่</button>
        </div>

        <div className="navPhaseNote">
          เส้นสีเขียวคือเส้นทางตามถนนจาก Routing Engine; หากระบบเส้นทางใช้งานไม่ได้ PawFeed จะแสดงเฉพาะระยะตรงและไม่สร้างเส้นทางปลอม
        </div>
      </section>
    </main>
  );
}
