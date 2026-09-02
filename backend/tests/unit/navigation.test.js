import { afterEach, describe, expect, jest, test } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { fetchRoute } from '../../src/modules/navigation/navigation.service.js';

const app = createApp();
const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe('navigation routing', () => {
  test('normalizes provider geometry, duration and steps', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 'Ok',
        routes: [{
          distance: 582.2,
          duration: 99.9,
          geometry: { type: 'LineString', coordinates: [[100.7794, 13.7285], [100.7789, 13.7291]] },
          legs: [{ steps: [{
            distance: 120.4,
            duration: 20.2,
            name: 'ถนนทดสอบ',
            maneuver: { type: 'turn', modifier: 'left', location: [100.779, 13.729] },
          }] }],
        }],
      }),
    });

    const route = await fetchRoute({
      originLat: 13.7285,
      originLng: 100.7794,
      destinationLat: 13.7291,
      destinationLng: 100.7789,
      mode: 'DRIVING',
    });

    expect(route.distanceMeters).toBe(582);
    expect(route.durationSeconds).toBe(100);
    expect(route.geometry).toEqual([[13.7285, 100.7794], [13.7291, 100.7789]]);
    expect(route.steps[0]).toMatchObject({ maneuverType: 'turn', maneuverModifier: 'left', location: [13.729, 100.779] });
    expect(global.fetch).toHaveBeenCalledWith(expect.objectContaining({ pathname: expect.stringContaining('/routed-car/') }), expect.any(Object));
  });

  test('public route endpoint validates mode and coordinates', async () => {
    const invalidMode = await request(app).get('/api/navigation/route').query({
      originLat: 13.7,
      originLng: 100.7,
      destinationLat: 13.8,
      destinationLng: 100.8,
      mode: 'FLYING',
    });
    expect(invalidMode.status).toBe(400);
    expect(invalidMode.body.error.code).toBe('VALIDATION_ERROR');

    const invalidCoordinate = await request(app).get('/api/navigation/route').query({
      originLat: 999,
      originLng: 100.7,
      destinationLat: 13.8,
      destinationLng: 100.8,
      mode: 'WALKING',
    });
    expect(invalidCoordinate.status).toBe(400);
  });

  test('maps no-route provider response to a controlled 404', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ code: 'NoRoute', routes: [] }) });
    const response = await request(app).get('/api/navigation/route').query({
      originLat: 13.7,
      originLng: 100.7,
      destinationLat: 13.8,
      destinationLng: 100.8,
      mode: 'CYCLING',
    });
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NAVIGATION_ROUTE_NOT_FOUND');
  });
});
