import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, jest, test } from '@jest/globals';
import { createApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';

const app = createApp();

describe('HTTP baseline without database dependency', () => {
  test('GET /health/live is public', async () => {
    const response = await request(app).get('/health/live');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: { status: 'live' } });
  });

  test('guest cannot create a point', async () => {
    const response = await request(app).post('/api/points');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTH_REQUIRED');
  });

  test('authenticated create rejects invalid coordinate before database write', async () => {
    const token = jwt.sign({ email: 'test@example.com' }, env.jwtAccessSecret, {
      subject: 'test-user',
      expiresIn: '5m',
    });
    const response = await request(app)
      .post('/api/points')
      .set('Cookie', `pawfeed_access=${token}`)
      .field('animalType', 'DOG')
      .field('estimatedCount', '1')
      .field('description', 'test')
      .field('latitude', '999')
      .field('longitude', '100');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('request logs omit query strings so GPS coordinates are not persisted in logs', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const response = await request(app).get('/api/navigation/route?originLat=13.7&originLng=100.7&destinationLat=13.8&destinationLng=100.8&mode=FLYING');
      expect(response.status).toBe(400);
      await new Promise((resolve) => setImmediate(resolve));

      const entry = logSpy.mock.calls
        .map(([line]) => JSON.parse(line))
        .find((item) => item.path === '/api/navigation/route');

      expect(entry).toBeDefined();
      expect(entry.path).toBe('/api/navigation/route');
      expect(JSON.stringify(entry)).not.toContain('originLat');
      expect(JSON.stringify(entry)).not.toContain('100.7');
    } finally {
      logSpy.mockRestore();
    }
  });

  test('authenticated create requires an image before database write', async () => {
    const token = jwt.sign({ email: 'test@example.com' }, env.jwtAccessSecret, {
      subject: 'test-user',
      expiresIn: '5m',
    });
    const response = await request(app)
      .post('/api/points')
      .set('Cookie', `pawfeed_access=${token}`)
      .field('animalType', 'DOG')
      .field('estimatedCount', '1')
      .field('description', 'test')
      .field('latitude', '13.7')
      .field('longitude', '100.7');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('IMAGE_REQUIRED');
  });
});
