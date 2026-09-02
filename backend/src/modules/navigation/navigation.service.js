import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';

const PROVIDER_PROFILE = {
  DRIVING: 'car',
  CYCLING: 'bike',
  WALKING: 'foot',
};

function providerUrl({ originLat, originLng, destinationLat, destinationLng, mode }) {
  const profile = PROVIDER_PROFILE[mode];
  const coordinates = `${originLng},${originLat};${destinationLng},${destinationLat}`;
  const url = new URL(`/routed-${profile}/route/v1/driving/${coordinates}`, env.routingBaseUrl);
  url.searchParams.set('overview', 'full');
  url.searchParams.set('geometries', 'geojson');
  url.searchParams.set('steps', 'true');
  return url;
}

function normalizeStep(step) {
  const location = step.maneuver?.location;
  return {
    distanceMeters: Math.round(step.distance ?? 0),
    durationSeconds: Math.round(step.duration ?? 0),
    name: step.name || '',
    maneuverType: step.maneuver?.type || null,
    maneuverModifier: step.maneuver?.modifier || null,
    location: Array.isArray(location) ? [location[1], location[0]] : null,
  };
}

async function requestProvider(url) {
  let lastError;
  const attempts = Math.max(1, env.routingRetries + 1);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.routingTimeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'PawFeed/1.0' },
      });

      if (!response.ok) {
        if (response.status >= 500 && attempt < attempts) continue;
        throw new AppError(502, 'ROUTING_PROVIDER_ERROR', 'ไม่สามารถคำนวณเส้นทางได้ในขณะนี้');
      }
      return await response.json();
    } catch (error) {
      if (error instanceof AppError) throw error;
      lastError = error;
      if (attempt < attempts) continue;
    } finally {
      clearTimeout(timeout);
    }
  }

  if (lastError?.name === 'AbortError') {
    throw new AppError(504, 'ROUTING_TIMEOUT', 'ระบบคำนวณเส้นทางใช้เวลานานเกินไป');
  }
  throw new AppError(502, 'ROUTING_PROVIDER_ERROR', 'ไม่สามารถเชื่อมต่อระบบคำนวณเส้นทางได้');
}

export async function fetchRoute(input) {
  const payload = await requestProvider(providerUrl(input));
  const route = payload.routes?.[0];

  if (payload.code !== 'Ok' || !route?.geometry?.coordinates?.length) {
    throw new AppError(404, 'NAVIGATION_ROUTE_NOT_FOUND', 'ไม่พบเส้นทางที่เหมาะสมระหว่างสองตำแหน่ง');
  }

  return {
    mode: input.mode,
    distanceMeters: Math.round(route.distance),
    durationSeconds: Math.round(route.duration),
    geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    steps: (route.legs ?? []).flatMap((leg) => (leg.steps ?? []).map(normalizeStep)),
    provider: 'OSRM',
  };
}
