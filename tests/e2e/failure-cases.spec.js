import { test, expect } from '@playwright/test';
import { fillCreatePointForm, pngFile, registerAndLogin } from './helpers.js';

test('guest is redirected to login before protected create page', async ({ page }) => {
  await page.goto('/points/create');
  await page.waitForURL(/\/login\?next=%2Fpoints%2Fcreate/);
  await expect(page.getByRole('heading', { name: 'เข้าสู่ระบบ PawFeed' })).toBeVisible();
});

test('invalid login shows generic error', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill('missing@example.com');
  await page.locator('input[type="password"]').fill('WrongPass123');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await expect(page.getByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeVisible();
});

test('login next redirect cannot leave the PawFeed origin', async ({ page }) => {
  const email = `redirect-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
  const password = 'Passw0rd123';

  await page.goto('/register');
  await page.getByLabel('ชื่อที่แสดง').fill('Redirect Guard');
  await page.getByLabel('อีเมล').fill(email);
  await page.getByLabel('รหัสผ่าน', { exact: true }).fill(password);
  await page.getByLabel('ยืนยันรหัสผ่าน').fill(password);
  await page.getByRole('button', { name: 'สร้างบัญชี' }).click();
  await page.waitForURL('**/login');

  const origin = new URL(page.url()).origin;
  await page.goto(`/login?next=${encodeURIComponent('/\\\\evil.example')}`);
  await page.getByLabel('อีเมล').fill(email);
  await page.getByLabel('รหัสผ่าน', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await page.waitForURL((url) => url.origin === origin && url.pathname === '/');
  expect(new URL(page.url()).origin).toBe(origin);
});

test('create point shows required image error before success state', async ({ page }) => {
  await registerAndLogin(page, 'missing-image');
  await page.goto('/points/create');
  await page.getByLabel(/คำอธิบาย/).fill('Point without image');
  await page.getByRole('button', { name: 'สร้างจุดบนแผนที่' }).click();
  await expect(page.getByText('กรุณาเพิ่มรูปอย่างน้อย 1 รูป')).toBeVisible();
  await expect(page).toHaveURL(/\/points\/create$/);
});

test('backend rejects disguised non-image and UI displays error', async ({ page }) => {
  await registerAndLogin(page, 'bad-image');
  await page.goto('/points/create');
  await fillCreatePointForm(page, {
    description: 'Point with invalid upload',
    image: {
      name: 'fake.png',
      mimeType: 'image/png',
      buffer: Buffer.from('not really an image'),
    },
  });
  await page.getByRole('button', { name: 'สร้างจุดบนแผนที่' }).click();
  await expect(page.getByText('เนื้อหาไฟล์ไม่ใช่รูปภาพที่รองรับ')).toBeVisible();
  await expect(page).toHaveURL(/\/points\/create$/);
});

test('network failure never shows false create success', async ({ page }) => {
  await registerAndLogin(page, 'network-failure');
  await page.goto('/points/create');
  await fillCreatePointForm(page, { description: 'Network failure point' });
  await page.route('**/api/points', (route) => {
    if (route.request().method() === 'POST') return route.abort('failed');
    return route.continue();
  });
  await page.getByRole('button', { name: 'สร้างจุดบนแผนที่' }).click();
  await expect(page.getByText('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง')).toBeVisible();
  await expect(page).toHaveURL(/\/points\/create$/);
});

test('geolocation denied shows fallback while map remains usable', async ({ page, context }) => {
  await context.clearPermissions();
  await page.goto('/');
  await expect(page.getByText(/ยังใช้ตำแหน่งปัจจุบันไม่ได้/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'ลองตำแหน่งอีกครั้ง' })).toBeVisible();
  await expect(page.locator('.leaflet-container')).toBeVisible();
});

test('insecure LAN navigation falls back to manual map position', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await registerAndLogin(page, 'manual-nav');
  await page.goto('/points/create');
  await fillCreatePointForm(page, { description: 'Manual navigation point' });
  await page.getByRole('button', { name: 'สร้างจุดบนแผนที่' }).click();
  await page.waitForURL((url) => /^\/points\/[^/]+$/.test(url.pathname) && url.pathname !== '/points/create');

  const pointId = new URL(page.url()).pathname.split('/').pop();
  await page.goto(`/points/${pointId}/navigate`);
  await expect(page.getByText(/ต้องเปิดผ่าน HTTPS หรือ localhost/)).toBeVisible();
  await page.getByRole('button', { name: 'เลือกบนแผนที่' }).click();
  await expect(page.getByRole('heading', { name: 'เลือกจุดเริ่มต้น' })).toBeVisible();

  const map = page.locator('.navigationMapCanvas');
  const box = await map.boundingBox();
  if (!box) throw new Error('Navigation map has no bounding box');
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.42);

  await expect(page.locator('.leaflet-tooltip').filter({ hasText: 'จุดเริ่มต้น' })).toBeVisible();
  await expect(page.locator('.navigation-road-route path').first()).toBeVisible();
  await expect(page.locator('.navOriginPill strong')).toHaveText('เลือกบนแผนที่');
  await expect(page.getByRole('button', { name: 'ใช้ GPS เพื่อเริ่มนำทาง' })).toBeVisible();
});

test('routing provider failure keeps direct fallback and shows an error state', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        watchPosition(success) {
          setTimeout(() => success({ coords: { latitude: 13.7285, longitude: 100.7794, accuracy: 8 } }), 0);
          return 1;
        },
        clearWatch() {},
      },
    });
  });

  await registerAndLogin(page, 'route-failure');
  await page.goto('/points/create');
  await fillCreatePointForm(page, { description: 'Routing failure point' });
  await page.getByRole('button', { name: 'สร้างจุดบนแผนที่' }).click();
  await page.waitForURL((url) => /^\/points\/[^/]+$/.test(url.pathname) && url.pathname !== '/points/create');
  const pointId = new URL(page.url()).pathname.split('/').pop();

  await page.route('**/api/navigation/route?**', (route) => route.fulfill({
    status: 502,
    contentType: 'application/json',
    body: JSON.stringify({ success: false, error: { code: 'ROUTING_PROVIDER_ERROR', message: 'provider unavailable' } }),
  }));

  await page.goto(`/points/${pointId}/navigate`);
  await expect(page.getByText(/ไม่สามารถคำนวณเส้นทางได้ในขณะนี้/)).toBeVisible();
  await expect(page.getByText(/เส้นประบนแผนที่เป็นเพียงแนวตรงอ้างอิง/)).toBeVisible();
  await expect(page.locator('.navigation-direct-fallback path').first()).toBeVisible();
  await expect(page.locator('.navigation-road-route path')).toHaveCount(0);
});
