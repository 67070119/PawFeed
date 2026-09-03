'use client';

const PHOTON_SEARCH_URL = 'https://photon.komoot.io/api/';

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function areaLabel(properties = {}) {
  return [properties.name, properties.district, properties.city, properties.state, properties.country]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(', ');
}

function normalizeResult(feature, index) {
  const properties = feature?.properties || {};
  const coordinates = feature?.geometry?.coordinates || [];
  const longitude = toNumber(coordinates[0]);
  const latitude = toNumber(coordinates[1]);
  const extent = Array.isArray(properties.extent) ? properties.extent.map(toNumber) : [];
  const [west, north, east, south] = extent;

  if (latitude === null || longitude === null) return null;

  return {
    id: `${properties.osm_type || 'place'}-${properties.osm_id || index}`,
    label: areaLabel(properties) || 'พื้นที่ที่ค้นหา',
    type: properties.type || properties.osm_value || '',
    center: [latitude, longitude],
    bounds: [south, west, north, east].every((value) => value !== null)
      ? [[south, west], [north, east]]
      : null,
  };
}

export async function searchAreas(query, { signal } = {}) {
  const value = query.trim();
  if (value.length < 2) return [];

  const params = new URLSearchParams({ q: value, limit: '8' });

  let response;
  try {
    response = await fetch(`${PHOTON_SEARCH_URL}?${params}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new Error('ไม่สามารถค้นหาพื้นที่ได้ กรุณาลองใหม่อีกครั้ง');
  }

  if (!response.ok) {
    throw new Error('บริการค้นหาพื้นที่ไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง');
  }

  const payload = await response.json();
  const features = Array.isArray(payload?.features) ? payload.features : [];

  return features
    .filter((feature) => feature?.properties?.countrycode === 'TH')
    .map(normalizeResult)
    .filter(Boolean)
    .slice(0, 5);
}
