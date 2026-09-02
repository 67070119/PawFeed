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

function nearestGeometryIndex(geometry, position) {
  if (!geometry?.length || !position) return 0;
  let nearest = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  geometry.forEach((coordinate, index) => {
    const distance = distanceMeters(position, coordinate);
    if (distance < nearestDistance) {
      nearest = index;
      nearestDistance = distance;
    }
  });
  return nearest;
}

function remainingMetrics(route, position, destination) {
  if (!route || !position || route.geometry.length < 2) {
    return { distanceMeters: route?.distanceMeters ?? null, durationSeconds: route?.durationSeconds ?? null, geometryIndex: 0 };
  }
  if (distanceMeters(position, destination) <= 20) {
    return { distanceMeters: 0, durationSeconds: 0, geometryIndex: route.geometry.length - 1 };
  }

  const currentIndex = nearestGeometryIndex(route.geometry, position);
  let totalGeometry = 0;
  let remainingGeometry = distanceMeters(position, route.geometry[currentIndex]);

  for (let index = 0; index < route.geometry.length - 1; index += 1) {
    const segment = distanceMeters(route.geometry[index], route.geometry[index + 1]);
    totalGeometry += segment;
    if (index >= currentIndex) remainingGeometry += segment;
  }

  const ratio = totalGeometry > 0 ? Math.min(1, Math.max(0, remainingGeometry / totalGeometry)) : 1;
  return {
    distanceMeters: Math.round(route.distanceMeters * ratio),
    durationSeconds: Math.round(route.durationSeconds * ratio),
    geometryIndex: currentIndex,
  };
}

function nextManeuver(route, position, currentGeometryIndex) {
  if (!route?.steps?.length || !position) return null;
  const actionable = route.steps
    .filter((step) => step.location && step.maneuverType !== 'depart')
    .map((step) => ({ ...step, geometryIndex: nearestGeometryIndex(route.geometry, step.location) }));

  for (const step of actionable) {
    const distance = distanceMeters(position, step.location);
    if (step.geometryIndex > currentGeometryIndex || distance > 25) return { ...step, distanceToManeuver: distance };
  }
  return actionable.at(-1) ?? null;
}

function maneuverIcon(step) {
  if (!step) return '↑';
  if (step.maneuverType === 'arrive') return '●';
  if (step.maneuverModifier?.includes('left')) return '↰';
  if (step.maneuverModifier?.includes('right')) return '↱';
  if (step.maneuverModifier === 'uturn') return '↶';
  return '↑';
}

function maneuverText(step) {
  if (!step) return 'ไปตามเส้นทาง';
  if (step.maneuverType === 'arrive') return 'ไปถึงจุดหมาย';
  const road = step.name ? ` เข้าสู่ ${step.name}` : '';
  if (step.maneuverModifier?.includes('left')) return `เลี้ยวซ้าย${road}`;
  if (step.maneuverModifier?.includes('right')) return `เลี้ยวขวา${road}`;
  if (step.maneuverModifier === 'uturn') return `กลับรถ${road}`;
  return `ตรงไป${road}`;
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
  const [activeNavigation, setActiveNavigation] = useState(false);
  const [followUser, setFollowUser] = useState(true);
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
    if (activeNavigation && route) return;

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
  }, [point, userPosition, travelMode, activeNavigation, route]);

  function startTracking() {
    if (watchRef.current != null) return;
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
        setActiveNavigation(false);
        setManualPicking(true);
        setError('ไม่สามารถเข้าถึงตำแหน่งได้ เลือกตำแหน่งของคุณบนแผนที่แทน');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
    setTracking(true);
  }

  function pickManualPosition(position) {
    stopTracking();
    setActiveNavigation(false);
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
    setActiveNavigation(false);
    setManualPicking(true);
    setError('แตะตำแหน่งของคุณบนแผนที่');
  }

  function selectTravelMode(mode) {
    if (mode === travelMode || activeNavigation) return;
    routeOriginRef.current = null;
    setTravelMode(mode);
    setRoute(null);
  }

  function startActiveNavigation() {
    if (!route || !userPosition || positionSource !== 'gps' || !tracking) return;
    setActiveNavigation(true);
    setFollowUser(true);
    setRecenterKey((value) => value + 1);
  }

  function stopActiveNavigation() {
    setActiveNavigation(false);
    setFollowUser(true);
    setRecenterKey((value) => value + 1);
  }

  function recenter() {
    setFollowUser(true);
    setRecenterKey((value) => value + 1);
  }

  if (loading) return <main className="centerState">กำลังเปิดโหมดนำทาง...</main>;
  if (!point) return <main className="page narrow"><div className="errorBox">{error || 'ไม่พบจุดนี้'}</div><Link href="/" className="button">← กลับแผนที่</Link></main>;

  const destination = [point.latitude, point.longitude];
  const directDistance = userPosition ? distanceMeters(userPosition, destination) : null;
  const activeMetrics = activeNavigation ? remainingMetrics(route, userPosition, destination) : null;
  const displayDistance = activeMetrics?.distanceMeters ?? route?.distanceMeters ?? directDistance;
  const displayDuration = activeMetrics?.durationSeconds ?? route?.durationSeconds ?? null;
  const currentManeuver = activeNavigation
    ? nextManeuver(route, userPosition, activeMetrics?.geometryIndex ?? 0)
    : null;
  const arrived = activeNavigation && directDistance != null && directDistance <= 20;
  const originLabel = userPosition
    ? positionSource === 'manual' ? 'ตำแหน่งที่เลือกบนแผนที่' : 'ตำแหน่งของคุณ'
    : 'ยังไม่ได้ระบุตำแหน่ง';

  const activeInstruction = arrived ? 'ถึงจุดหมายแล้ว' : maneuverText(currentManeuver);
  const activeInstructionDistance = arrived ? '0 ม.' : formatDistance(currentManeuver?.distanceToManeuver);

  return (
    <main className={`navExperience${activeNavigation ? ' navActiveExperience' : ''}`}>
      <section className="navMapStage" aria-label="แผนที่นำทาง">
        <NavigationMap
          destination={destination}
          userPosition={userPosition}
          accuracy={accuracy}
          routeGeometry={route?.geometry ?? []}
          recenterKey={recenterKey}
          manualPickEnabled={manualPicking}
          onManualPick={pickManualPosition}
          activeNavigation={activeNavigation}
          followUser={followUser}
          onUserMapInteraction={() => setFollowUser(false)}
        />

        {activeNavigation ? (
          <div className="navActiveTopBar" aria-label="คำแนะนำการนำทาง">
            <div className="navManeuverIcon">{arrived ? '✓' : maneuverIcon(currentManeuver)}</div>
            <div className="navManeuverCopy">
              <small>{arrived ? 'จุดหมาย' : activeInstructionDistance}</small>
              <strong>{activeInstruction}</strong>
              {!arrived && currentManeuver?.name && <span>{currentManeuver.name}</span>}
            </div>
          </div>
        ) : (
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
        )}

        {manualPicking && <div className="navPickHint">แตะบนแผนที่เพื่อเลือกตำแหน่งของคุณ</div>}

        <div className="navMapControls">
          <button
            className={`navMapButton${activeNavigation && !followUser ? ' navRecenterNeeded' : ''}`}
            onClick={recenter}
            aria-label={activeNavigation ? 'กลับมาติดตามตำแหน่งฉัน' : 'จัดแผนที่ให้อยู่กึ่งกลาง'}
          >⌖</button>
        </div>
      </section>

      <section className={`navBottomSheet${activeNavigation ? ' navActiveSheet' : ''}`} aria-label="ข้อมูลการนำทาง">
        <div className="navSheetHandle" />

        {!activeNavigation && (
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
        )}

        <div className="navSheetHeader">
          <div>
            <span className="eyebrow">{activeNavigation ? 'กำลังนำทาง' : 'Route Preview'}</span>
            <h1>{activeNavigation ? formatDuration(displayDuration) : routeLoading ? 'กำลังหาเส้นทาง...' : route ? formatDuration(route.durationSeconds) : 'เลือกตำแหน่งเริ่มต้น'}</h1>
            <p>{activeNavigation ? `${formatDistance(displayDistance)} ถึงจุดหมาย` : route ? `เส้นทางตามถนน · ${route.provider}` : 'ระบุตำแหน่งเพื่อคำนวณเส้นทางตามถนน'}</p>
          </div>
          <div className="navDistanceSummary">
            <strong>{formatDistance(displayDistance)}</strong>
            <span>{activeNavigation ? 'เหลือ' : route ? 'ตามเส้นทาง' : 'ระยะตรง'}</span>
          </div>
        </div>

        {error && <div className="navInlineNotice" role="status">{error}</div>}
        {routeError && !activeNavigation && <div className="navInlineNotice routeErrorNotice" role="status">{routeError}</div>}
        {activeNavigation && !followUser && <div className="navInlineNotice navFollowNotice" role="status">คุณเลื่อนแผนที่แล้ว กดปุ่ม ⌖ เพื่อกลับมาติดตามตำแหน่ง</div>}

        <div className="navCompactStats">
          <div className="navStatItem">
            <small>{activeNavigation ? 'เวลาที่เหลือ' : 'เวลาโดยประมาณ'}</small>
            <strong>{routeLoading ? 'กำลังคำนวณ' : formatDuration(displayDuration)}</strong>
          </div>
          <div className="navStatItem">
            <small>{activeNavigation ? 'GPS' : positionSource === 'manual' ? 'ตำแหน่ง' : 'ความแม่นยำ GPS'}</small>
            <strong>{activeNavigation ? accuracy ? `±${accuracy} ม.` : 'กำลังติดตาม' : positionSource === 'manual' ? 'เลือกบนแผนที่' : accuracy ? `±${accuracy} ม.` : '—'}</strong>
          </div>
        </div>

        <div className="navPrimaryActions">
          {activeNavigation ? (
            <button className="navStartButton navStopButton" onClick={stopActiveNavigation}>■ สิ้นสุดการนำทาง</button>
          ) : route && positionSource === 'gps' && tracking ? (
            <button className="navStartButton" onClick={startActiveNavigation}>▶ เริ่มนำทาง</button>
          ) : (
            <button className="navStartButton" onClick={startTracking}>◎ ใช้ตำแหน่งฉัน</button>
          )}
          {!activeNavigation && (
            <button className={`navSecondaryButton ${manualPicking ? 'active' : ''}`} onClick={beginManualPick}>📍 เลือกบนแผนที่</button>
          )}
        </div>

        <div className="navPhaseNote">
          {activeNavigation
            ? 'PawFeed ใช้ Route Steps เพื่อแสดงคำแนะนำถัดไปและติดตามตำแหน่งบนเส้นทาง โดยยังไม่ทำ off-route auto-reroute ใน Phase นี้'
            : 'เส้นสีเขียวคือเส้นทางตามถนนจาก Routing Engine; ใช้ GPS เพื่อเริ่ม Active Navigation'}
        </div>
      </section>
    </main>
  );
}
