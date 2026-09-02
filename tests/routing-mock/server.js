import http from 'node:http';

const MODE_RESULT = {
  car: { distance: 2500, duration: 300 },
  bike: { distance: 2100, duration: 480 },
  foot: { distance: 1800, duration: 1500 },
};

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://routing-mock');
  if (url.pathname === '/health') return json(res, 200, { ok: true });

  const match = url.pathname.match(/^\/routed-(car|bike|foot)\/route\/v1\/driving\/([^;]+);([^/]+)$/);
  if (!match) return json(res, 404, { code: 'InvalidUrl' });

  const [, profile, originRaw, destinationRaw] = match;
  const [originLng, originLat] = originRaw.split(',').map(Number);
  const [destinationLng, destinationLat] = destinationRaw.split(',').map(Number);
  const midLng = (originLng + destinationLng) / 2 + 0.001;
  const midLat = (originLat + destinationLat) / 2 + 0.001;
  const result = MODE_RESULT[profile];

  return json(res, 200, {
    code: 'Ok',
    routes: [{
      distance: result.distance,
      duration: result.duration,
      geometry: {
        type: 'LineString',
        coordinates: [
          [originLng, originLat],
          [midLng, midLat],
          [destinationLng, destinationLat],
        ],
      },
      legs: [{
        steps: [
          {
            distance: Math.round(result.distance * 0.45),
            duration: Math.round(result.duration * 0.45),
            name: 'Mock Road A',
            maneuver: { type: 'depart', modifier: 'straight', location: [originLng, originLat] },
          },
          {
            distance: Math.round(result.distance * 0.35),
            duration: Math.round(result.duration * 0.35),
            name: 'Mock Road B',
            maneuver: { type: 'turn', modifier: 'right', location: [midLng, midLat] },
          },
          {
            distance: Math.round(result.distance * 0.2),
            duration: Math.round(result.duration * 0.2),
            name: 'Destination Road',
            maneuver: { type: 'arrive', modifier: 'straight', location: [destinationLng, destinationLat] },
          },
        ],
      }],
    }],
  });
});

server.listen(8080, '0.0.0.0', () => {
  console.log('routing mock listening on 8080');
});
