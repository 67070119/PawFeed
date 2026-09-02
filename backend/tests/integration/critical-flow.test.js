import fs from 'node:fs/promises';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';

const app = createApp();
const pngBuffer = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0x00,0x00,0x00,0x00]);

async function clearDb() {
  await prisma.pointReport.deleteMany();
  await prisma.feeding.deleteMany();
  await prisma.pointImage.deleteMany();
  await prisma.strayPoint.deleteMany();
  await prisma.user.deleteMany();
}

beforeAll(async () => {
  await clearDb();
});

afterAll(async () => {
  await clearDb();
  await prisma.$disconnect();
  if (process.env.UPLOAD_DIR) await fs.rm(process.env.UPLOAD_DIR, { recursive: true, force: true });
});

describe('PawFeed real database critical flow', () => {
  test('register, login, create point, query, feed, report and profile', async () => {
    const agent = request.agent(app);

    const register = await agent.post('/api/auth/register').send({
      name: 'Integration User',
      email: 'integration@example.com',
      password: 'Passw0rd123',
    });
    expect(register.status).toBe(201);
    expect(register.body.data.email).toBe('integration@example.com');
    expect(register.body.data.passwordHash).toBeUndefined();

    const login = await agent.post('/api/auth/login').send({
      email: 'integration@example.com',
      password: 'Passw0rd123',
    });
    expect(login.status).toBe(200);
    expect(login.headers['set-cookie']?.join(';')).toContain('pawfeed_access=');
    expect(login.headers['set-cookie']?.join(';')).toContain('HttpOnly');

    const created = await agent
      .post('/api/points')
      .field('animalType', 'DOG')
      .field('estimatedCount', '3')
      .field('description', 'Integration point')
      .field('latitude', '13.7291')
      .field('longitude', '100.7789')
      .field('usualTime', '17:00 - 20:00')
      .attach('image', pngBuffer, { filename: 'client-name.png', contentType: 'image/png' });

    expect(created.status).toBe(201);
    const pointId = created.body.data.id;
    expect(pointId).toBeTruthy();
    expect(created.body.data.images).toHaveLength(1);
    expect(created.body.data.images[0].imageUrl).toMatch(/^\/uploads\/[0-9a-f-]+\.png$/);
    expect(created.body.data.images[0].imageUrl).not.toContain('client-name');

    const map = await request(app).get('/api/points').query({
      minLat: 13.7,
      maxLat: 13.8,
      minLng: 100.7,
      maxLng: 100.9,
    });
    expect(map.status).toBe(200);
    expect(map.body.data.some((p) => p.id === pointId)).toBe(true);

    const feeding = await agent.post(`/api/points/${pointId}/feedings`).send({ note: 'Integration feeding' });
    expect(feeding.status).toBe(201);
    expect(feeding.body.data.feeding.pointId).toBe(pointId);
    expect(feeding.body.data.feeding.note).toBe('Integration feeding');
    expect(feeding.body.data.latestFeedingAt).toBeTruthy();

    const beforeReport = await request(app).get(`/api/points/${pointId}`);
    const beforeLastSeen = new Date(beforeReport.body.data.lastSeenAt).getTime();

    await new Promise((resolve) => setTimeout(resolve, 10));
    const report = await agent.post(`/api/points/${pointId}/reports`).send({ type: 'STILL_HERE' });
    expect(report.status).toBe(201);

    const detail = await request(app).get(`/api/points/${pointId}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.feedings).toHaveLength(1);
    expect(detail.body.data.latestFeedingAt).toBeTruthy();
    expect(detail.body.data.reports[0].type).toBe('STILL_HERE');
    expect(new Date(detail.body.data.lastSeenAt).getTime()).toBeGreaterThanOrEqual(beforeLastSeen);

    const profilePoints = await agent.get('/api/profile/points');
    expect(profilePoints.status).toBe(200);
    expect(profilePoints.body.data.some((p) => p.id === pointId)).toBe(true);

    const profileFeedings = await agent.get('/api/profile/feedings');
    expect(profileFeedings.status).toBe(200);
    expect(profileFeedings.body.data.some((f) => f.pointId === pointId)).toBe(true);
  });

  test('wrong password returns generic credential error', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'integration@example.com',
      password: 'WrongPass123',
    });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(response.body.error.message).toBe('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  });

  test('guest create is rejected before mutation', async () => {
    const response = await request(app)
      .post('/api/points')
      .field('animalType', 'DOG')
      .field('estimatedCount', '1')
      .field('description', 'guest must fail')
      .field('latitude', '13.7')
      .field('longitude', '100.7')
      .attach('image', pngBuffer, { filename: 'guest.png', contentType: 'image/png' });
    expect(response.status).toBe(401);
  });

  test('authenticated invalid coordinate and non-image are rejected', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'integration@example.com', password: 'Passw0rd123' });

    const badCoordinate = await agent
      .post('/api/points')
      .field('animalType', 'DOG')
      .field('estimatedCount', '1')
      .field('description', 'invalid coordinate')
      .field('latitude', '999')
      .field('longitude', '100.7')
      .attach('image', pngBuffer, { filename: 'valid.png', contentType: 'image/png' });
    expect(badCoordinate.status).toBe(400);

    const nonImage = await agent
      .post('/api/points')
      .field('animalType', 'DOG')
      .field('estimatedCount', '1')
      .field('description', 'bad image')
      .field('latitude', '13.7')
      .field('longitude', '100.7')
      .attach('image', Buffer.from('not an image'), { filename: 'fake.txt', contentType: 'text/plain' });
    expect(nonImage.status).toBe(415);
  });

  test('session lifecycle, password hashing and current user work correctly', async () => {
    const user = await prisma.user.findUnique({ where: { email: 'integration@example.com' } });
    expect(user.passwordHash).toBeTruthy();
    expect(user.passwordHash).not.toBe('Passw0rd123');

    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'integration@example.com', password: 'Passw0rd123' }).expect(200);
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe('integration@example.com');

    const logout = await agent.post('/api/auth/logout');
    expect(logout.status).toBe(200);
    expect(logout.headers['set-cookie']?.join(';')).toContain('pawfeed_access=;');
    await agent.get('/api/auth/me').expect(401);
  });

  test('missing point, optional feeding note and invalid report type are handled', async () => {
    const point = await prisma.strayPoint.findFirst({ select: { id: true } });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'integration@example.com', password: 'Passw0rd123' }).expect(200);

    const noNote = await agent.post(`/api/points/${point.id}/feedings`).send({});
    expect(noNote.status).toBe(201);
    expect(noNote.body.data.feeding.note).toBeNull();

    const invalidReport = await agent.post(`/api/points/${point.id}/reports`).send({ type: 'UNKNOWN' });
    expect(invalidReport.status).toBe(400);

    const missing = await request(app).get('/api/points/missing-point-id');
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('POINT_NOT_FOUND');
  });

  test('oversized image is rejected by configured upload limit', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'integration@example.com', password: 'Passw0rd123' }).expect(200);
    const oversized = Buffer.alloc((5 * 1024 * 1024) + 1, 0);
    oversized.set(pngBuffer, 0);

    const response = await agent
      .post('/api/points')
      .field('animalType', 'DOG')
      .field('estimatedCount', '1')
      .field('description', 'oversized image')
      .field('latitude', '13.7')
      .field('longitude', '100.7')
      .attach('image', oversized, { filename: 'large.png', contentType: 'image/png' });

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('FILE_TOO_LARGE');
  });

});
