'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../../../lib/api';

const NavigationMap = dynamic(() => import('../../../../components/NavigationMap'), { ssr: false });

const MODE_OPTIONS = [
  { value: 'DRIVING', label: 'รถ' },
  { value: 'WALKING', label: 'เดิน' },
  { value: 'CYCLING', label: 'จักรยาน' },
];

const OFF_ROUTE_MIN_METERS = 60;
const OFF_ROUTE_FIXES_REQUIRED = 2;
const REROUTE_COOLDOWN_MS = 10000;

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

function pointToSegmentDistanceMeters(point, start, end) {
  const latRef = ((point[0] + start[0] + end[0]) / 3) * (Math.PI / 180);
  const metersPerLat = 111320;
  const metersPerLng = 111320 * Math.cos(latRef);
  const px = (point[1] - start[1]) * metersPerLng;
  const py = (point[0] - start[0]) * metersPerLat;
  const ex = (end[1] - start[1]) * metersPerLng;
  const ey = (end[0] - start[0]) * metersPerLat;
  const lengthSquared = ex * ex + ey * ey;
  if (!lengthSquared) return Math.hypot(px, py);
  const projection = Math.max(0, Math.min(1, (px * ex + py * ey) / lengthSquared));
  return Math.hypot(px - projection * ex, py - projection * ey);
}

function distanceToRoute(geometry, position) {
  if (!geometry?.length || !position) return Number.POSITIVE_INFINITY;
  if (geometry.length === 1) return distanceMeters(position, geometry[0]);
  let nearest = Number.POSITIVE_INFINITY;
  for (let index = 0; index < geometry.length - 1; index += 1) {
    nearest = Math.min(nearest, pointToSegmentDistanceMeters(position, geometry[index], geometry[index + 1]));
  }
  return nearest;
}

function formatDistance(meters) {
  if (meters == null || !Number.isFinite(meters)) return '—';
  if (meters < 1000) return `${Math.round(meters)} ม.`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} กม.`;
}

function formatDuration(seconds) {
  if (seconds == null) return '—';
  if (seconds <= 0) return '0 นาที';
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} นาที`;
  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;
  return remain ? `${hours} ชม. ${remain} นาที` : `${hours} ชม.`;
}

function routingErrorMessage(error) {
  if (error?.code === 'NAVIGATION_ROUTE_NOT_FOUND') return 'ไม่พบเส้นทางสำหรับโหมดนี้';
  if (error?.code === 'ROUTING_TIMEOUT') return 'คำนวณเส้นทางนานเกินไป กรุณาลองใหม่';
  return 'ไม่สามารถคำนวณเส้นทางได้ในขณะนี้';
}

function gpsQuality(accuracy) {
  if (accuracy == null) return { id: 'unknown', label: 'กำลังตรวจ', className: '' };
  if (accuracy <= 25) return { id: 'good', label: 'ดี', className: 'gpsGood' };
  if (accuracy <= 60) return { id: 'fair', label: 'ปานกลาง', className: 'gpsFair' };
  return { id: 'poor', label: 'ต่ำ', className: 'gpsPoor' };
}

function geolocationErrorMessage(error) {
  if (error?.code === 1) return 'กรุณาอนุญาต Location เพื่อใช้การนำทาง';
  if (error?.code === 2) return 'ไม่พบสัญญาณ GPS กรุณาลองอีกครั้ง';
  if (error?.code === 3) return 'ค้นหาตำแหน่งนานเกินไป กรุณาลองอีกครั้ง';
  return 'ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้';
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
  if (step.maneuverType === 'arrive') return 'ถึงจุดหมาย';
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
  const [locating, setLocating] = useState(false);
  const [positionSource, setPositionSource] = useState(null);
  const [error, setError] = useState('');
  const [gpsError, setGpsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [recenterKey, setRecenterKey] = useState(0);
  const [travelMode, setTravelMode] = useState('DRIVING');
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [activeNavigation, setActiveNavigation] = useState(false);
  const [followUser, setFollowUser] = useState(true);
  const [rerouting, setRerouting] = useState(false);
  const [rerouteError, setRerouteError] = useState('');
  const [offRoute, setOffRoute] = useState(false);
  const [recoveryNotice, setRecoveryNotice] = useState('');
  const [sheetCollapsed, setSheetCollapsed] = useState(false);
  const watchRef = useRef(null);
  const autoLocateRef = useRef(false);
  const routeRequestRef = useRef(0);
  const routeOriginRef = useRef(null);
  const routeModeRef = useRef(null);
  const offRouteFixesRef = useRef(0);
  const rerouteCooldownRef = useRef(0);
  const activeNavigationRef = useRef(false);
  const recoveryTimerRef = useRef(null);

  useEffect(() => { activeNavigationRef.current = activeNavigation; }, [activeNavigation]);
  useEffect(() => {
    if (gpsError || routeError || rerouteError || offRoute) setSheetCollapsed(false);
  }, [gpsError, routeError, rerouteError, offRoute]);

  const stopTracking = useCallback(() => {
    if (watchRef.current != null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    setTracking(false);
    setLocating(false);
  }, []);

  useEffect(() => {
    api(`/api/points/${id}`)
      .then(setPoint)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => () => {
    stopTracking();
    if (recoveryTimerRef.current) clearTimeout(recoveryTimerRef.current);
  }, [stopTracking]);

  const showRecoveryNotice = useCallback((message) => {
    setRecoveryNotice(message);
    if (recoveryTimerRef.current) clearTimeout(recoveryTimerRef.current);
    recoveryTimerRef.current = setTimeout(() => setRecoveryNotice(''), 3500);
  }, []);

  const requestRoute = useCallback(async (origin, { reroute = false } = {}) => {
    if (!point || !origin) return false;
    const requestId = ++routeRequestRef.current;
    if (reroute) {
      setRerouting(true);
      setRerouteError('');
    } else {
      setRouteLoading(true);
      setRouteError('');
    }

    const params = new URLSearchParams({
      originLat: String(origin[0]),
      originLng: String(origin[1]),
      destinationLat: String(point.latitude),
      destinationLng: String(point.longitude),
      mode: travelMode,
    });

    try {
      const data = await api(`/api/navigation/route?${params}`);
      if (routeRequestRef.current !== requestId) return false;
      setRoute(data);
      routeOriginRef.current = origin;
      routeModeRef.current = travelMode;
      setOffRoute(false);
      offRouteFixesRef.current = 0;
      if (reroute) showRecoveryNotice('ปรับเส้นทางแล้ว');
      return true;
    } catch (err) {
      if (routeRequestRef.current !== requestId) return false;
      if (reroute) {
        setRerouteError('ปรับเส้นทางไม่สำเร็จ ยังใช้เส้นทางเดิมอยู่');
      } else {
        setRoute(null);
        setRouteError(routingErrorMessage(err));
      }
      return false;
    } finally {
      if (routeRequestRef.current === requestId) {
        if (reroute) setRerouting(false);
        else setRouteLoading(false);
      }
    }
  }, [point, travelMode, showRecoveryNotice]);

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
    requestRoute(userPosition);
  }, [point, userPosition, travelMode, activeNavigation, route, requestRoute]);

  useEffect(() => {
    if (!activeNavigation || !route || !userPosition || positionSource !== 'gps' || !tracking || rerouting) return;

    const quality = gpsQuality(accuracy);
    const deviation = distanceToRoute(route.geometry, userPosition);
    if (quality.id === 'poor') {
      offRouteFixesRef.current = 0;
      setOffRoute(false);
      return;
    }

    const threshold = Math.max(OFF_ROUTE_MIN_METERS, (accuracy ?? 0) * 2);
    if (deviation <= threshold) {
      offRouteFixesRef.current = 0;
      setOffRoute(false);
      setRerouteError('');
      return;
    }

    offRouteFixesRef.current += 1;
    if (offRouteFixesRef.current < OFF_ROUTE_FIXES_REQUIRED) return;

    setOffRoute(true);
    const now = Date.now();
    if (now < rerouteCooldownRef.current) return;
    rerouteCooldownRef.current = now + REROUTE_COOLDOWN_MS;
    requestRoute(userPosition, { reroute: true });
  }, [activeNavigation, route, userPosition, positionSource, tracking, accuracy, rerouting, requestRoute]);

  const startTracking = useCallback(() => {
    if (watchRef.current != null) return;
    setGpsError('');
    setLocating(true);

    if (!window.isSecureContext) {
      stopTracking();
      setGpsError('การนำทางด้วยตำแหน่งปัจจุบันต้องเปิดผ่าน HTTPS หรือ localhost');
      return;
    }
    if (!navigator.geolocation) {
      setLocating(false);
      setGpsError('อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง');
      return;
    }

    watchRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setUserPosition([coords.latitude, coords.longitude]);
        setAccuracy(Math.round(coords.accuracy));
        setPositionSource('gps');
        setTracking(true);
        setLocating(false);
        setGpsError('');
      },
      (geoError) => {
        const wasActive = activeNavigationRef.current;
        stopTracking();
        setGpsError(geolocationErrorMessage(geoError));
        setFollowUser(false);
        if (!wasActive) {
          setUserPosition(null);
          setAccuracy(null);
          setPositionSource(null);
          setRoute(null);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
  }, [stopTracking]);

  useEffect(() => {
    if (!point || autoLocateRef.current) return;
    autoLocateRef.current = true;
    startTracking();
  }, [point, startTracking]);

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
    setSheetCollapsed(false);
    setRerouteError('');
    setRecenterKey((value) => value + 1);
  }

  function stopActiveNavigation() {
    setActiveNavigation(false);
    setFollowUser(true);
    setOffRoute(false);
    setRerouteError('');
    offRouteFixesRef.current = 0;
    setRecenterKey((value) => value + 1);
  }

  function recenter() {
    setFollowUser(true);
    setRecenterKey((value) => value + 1);
  }

  function retryCurrentRoute() {
    if (!userPosition) return startTracking();
    routeOriginRef.current = null;
    requestRoute(userPosition);
  }

  function retryReroute() {
    if (!userPosition || rerouting) return;
    rerouteCooldownRef.current = Date.now() + REROUTE_COOLDOWN_MS;
    requestRoute(userPosition, { reroute: true });
  }

  if (loading) return <main className="centerState">กำลังเปิดโหมดนำทาง...</main>;
  if (!point) return <main className="page narrow"><div className="errorBox">{error || 'ไม่พบจุดนี้'}</div><Link href="/" className="button">← กลับแผนที่</Link></main>;

  const destination = [point.latitude, point.longitude];
  const directDistance = userPosition ? distanceMeters(userPosition, destination) : null;
  const activeMetrics = activeNavigation ? remainingMetrics(route, userPosition, destination) : null;
  const displayDistance = activeMetrics?.distanceMeters ?? route?.distanceMeters ?? null;
  const displayDuration = activeMetrics?.durationSeconds ?? route?.durationSeconds ?? null;
  const currentManeuver = activeNavigation ? nextManeuver(route, userPosition, activeMetrics?.geometryIndex ?? 0) : null;
  const arrived = activeNavigation && directDistance != null && directDistance <= 20;
  const quality = gpsQuality(accuracy);
  const activeInstruction = arrived ? 'ถึงจุดหมายแล้ว' : maneuverText(currentManeuver);
  const activeInstructionDistance = arrived ? '0 ม.' : formatDistance(currentManeuver?.distanceToManeuver);
  const previewTitle = locating ? 'กำลังหาตำแหน่ง...' : routeLoading ? 'กำลังหาเส้นทาง...' : route ? formatDuration(route.durationSeconds) : gpsError ? 'ใช้ตำแหน่งไม่ได้' : 'กำลังเตรียมเส้นทาง...';

  return (
    <main className={`navExperience${activeNavigation ? ' navActiveExperience' : ''}`}>
      <section className="navMapStage" aria-label="แผนที่นำทาง">
        <NavigationMap
          destination={destination}
          userPosition={userPosition}
          accuracy={accuracy}
          routeGeometry={route?.geometry ?? []}
          recenterKey={recenterKey}
          activeNavigation={activeNavigation}
          followUser={followUser}
          onUserMapInteraction={() => setFollowUser(false)}
        />

        {activeNavigation ? (
          <div className="navActiveTopBar" aria-label="คำแนะนำการนำทาง">
            <div className={`navManeuverIcon${arrived ? ' arrived' : ''}`}>{arrived ? 'ถึง' : maneuverIcon(currentManeuver)}</div>
            <div className="navManeuverCopy">
              <small>{arrived ? 'จุดหมาย' : activeInstructionDistance}</small>
              <strong>{rerouting ? 'กำลังปรับเส้นทาง...' : activeInstruction}</strong>
            </div>
          </div>
        ) : (
          <div className="navTopBar navTopBarSimple">
            <Link href={`/points/${id}`} className="navRoundButton" aria-label="กลับรายละเอียดจุด">←</Link>
            <div className="navDestinationCompact"><span>จุดหมาย</span><strong>{point.description}</strong></div>
          </div>
        )}

        <div className="navMapControls">
          <button
            className={`navMapButton${activeNavigation && !followUser ? ' navRecenterNeeded' : ''}`}
            onClick={userPosition ? recenter : startTracking}
            aria-label={userPosition ? 'กลับมาติดตามตำแหน่งฉัน' : 'ค้นหาตำแหน่งปัจจุบัน'}
            disabled={locating}
          ><span className="navRecenterIcon" aria-hidden="true" /></button>
        </div>
      </section>

      <section className={`navBottomSheet navBottomSheetSimple${activeNavigation ? ' navActiveSheet' : ''}${sheetCollapsed ? ' navSheetCollapsed' : ''}`} aria-label="ข้อมูลการนำทาง">
        <button
          type="button"
          className="navSheetHandleButton"
          aria-label={sheetCollapsed ? 'ขยายแผงข้อมูล' : 'ย่อแผงข้อมูล'}
          aria-expanded={!sheetCollapsed}
          onClick={() => setSheetCollapsed((value) => !value)}
        ><span className="navSheetHandle" /></button>

        {!activeNavigation && (
          <div className="navModeTabs navModeTabsSimple" aria-label="เลือกโหมดเดินทาง">
            {MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`navModeTab ${travelMode === option.value ? 'active' : ''}`}
                onClick={() => selectTravelMode(option.value)}
                aria-pressed={travelMode === option.value}
              ><span className="navModeLabel">{option.label}</span></button>
            ))}
          </div>
        )}

        <div className="navSheetHeader navSheetHeaderSimple">
          <div>
            <span className="eyebrow">{activeNavigation ? 'กำลังนำทาง' : 'เส้นทาง'}</span>
            <h1>{activeNavigation ? formatDuration(displayDuration) : previewTitle}</h1>
            {!activeNavigation && !route && <p>{gpsError ? 'อนุญาตตำแหน่งแล้วกดลองอีกครั้ง' : locating ? 'กำลังอ่านตำแหน่งปัจจุบัน' : 'กำลังเตรียมเส้นทางจากตำแหน่งปัจจุบัน'}</p>}
          </div>
          {(route || activeNavigation) && (
            <div className="navDistanceSummary"><strong>{formatDistance(displayDistance)}</strong><span>{activeNavigation ? 'เหลือ' : 'ระยะทาง'}</span></div>
          )}
        </div>

        {error && <div className="navInlineNotice" role="status">{error}</div>}
        {gpsError && <div className="navInlineNotice gpsErrorNotice" role="status">{gpsError}</div>}
        {routeError && !activeNavigation && <div className="navInlineNotice routeErrorNotice" role="status">{routeError}<button type="button" className="navInlineRetry" onClick={retryCurrentRoute}>ลองอีกครั้ง</button></div>}
        {activeNavigation && offRoute && !rerouting && !rerouteError && <div className="navInlineNotice navOffRouteNotice" role="status">ออกจากเส้นทาง กำลังปรับเส้นทางใหม่</div>}
        {rerouteError && <div className="navInlineNotice routeErrorNotice" role="status">{rerouteError}<button type="button" className="navInlineRetry" onClick={retryReroute}>ลองอีกครั้ง</button></div>}
        {recoveryNotice && <div className="navInlineNotice navRecoveryNotice" role="status">{recoveryNotice}</div>}

        {!sheetCollapsed && positionSource === 'gps' && accuracy != null && (
          <div className={`navGpsPill ${quality.className}`}><span>GPS {quality.label}</span><strong>±{accuracy} ม.</strong></div>
        )}

        <div className="navPrimaryActions navPrimaryActionsSimple">
          {activeNavigation ? (
            tracking ? (
              <button className="navStartButton navStopButton" onClick={stopActiveNavigation}>สิ้นสุดการนำทาง</button>
            ) : (
              <>
                <button className="navStartButton" onClick={startTracking}>ลอง GPS อีกครั้ง</button>
                <button className="navSecondaryButton" onClick={stopActiveNavigation}>สิ้นสุด</button>
              </>
            )
          ) : route && positionSource === 'gps' && tracking ? (
            <button className="navStartButton" onClick={startActiveNavigation}>เริ่มนำทาง</button>
          ) : gpsError ? (
            <button className="navStartButton" onClick={startTracking}>ลองตำแหน่งอีกครั้ง</button>
          ) : (
            <button className="navStartButton" disabled>{locating ? 'กำลังหาตำแหน่ง...' : routeLoading ? 'กำลังคำนวณเส้นทาง...' : 'กำลังเตรียมเส้นทาง...'}</button>
          )}
        </div>
      </section>
    </main>
  );
}
