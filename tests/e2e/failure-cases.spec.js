import { test, expect } from '@playwright/test';
import { pngFile, registerAndLogin } from './helpers.js';

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

test('create point shows required image error before success state', async ({ page }) => {
  await registerAndLogin(page, 'missing-image');
  await page.goto('/points/create');
  await page.locator('textarea').fill('Point without image');
  await page.getByRole('button', { name: 'สร้างจุดบนแผนที่' }).click();
  await expect(page.getByText('กรุณาเพิ่มรูปอย่างน้อย 1 รูป')).toBeVisible();
  await expect(page).toHaveURL(/\/points\/create$/);
});

test('backend rejects disguised non-image and UI displays error', async ({ page }) => {
  await registerAndLogin(page, 'bad-image');
  await page.goto('/points/create');
  await page.locator('textarea').fill('Point with invalid upload');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'fake.png',
    mimeType: 'image/png',
    buffer: Buffer.from('not really an image'),
  });
  await page.getByRole('button', { name: 'สร้างจุดบนแผนที่' }).click();
  await expect(page.getByText('เนื้อหาไฟล์ไม่ใช่รูปภาพที่รองรับ')).toBeVisible();
  await expect(page).toHaveURL(/\/points\/create$/);
});

test('network failure never shows false create success', async ({ page }) => {
  await registerAndLogin(page, 'network-failure');
  await page.goto('/points/create');
  await page.locator('textarea').fill('Network failure point');
  await page.locator('input[type="file"]').setInputFiles(pngFile);
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
  await page.getByRole('button', { name: /ตำแหน่งฉัน/ }).click();
  await expect(page.getByText('ไม่ได้รับสิทธิ์ตำแหน่ง คุณยังสามารถเลื่อนแผนที่เองได้')).toBeVisible();
  await expect(page.locator('.leaflet-container')).toBeVisible();
});


test('insecure LAN navigation falls back to manual map position', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await registerAndLogin(page, 'manual-nav');
  await page.goto('/points/create');

  const numberInputs = page.locator('input[type="number"]');
  await numberInputs.nth(0).fill('13.7291');
  await numberInputs.nth(1).fill('100.7789');
  await numberInputs.nth(2).fill('1');
  await page.locator('select').selectOption('DOG');
  await page.locator('textarea').fill('Manual navigation point');
  await page.locator('input[type="file"]').setInputFiles(pngFile);
  await page.getByRole('button', { name: 'สร้างจุดบนแผนที่' }).click();
  await page.waitForURL((url) => /^\/points\/[^/]+$/.test(url.pathname) && url.pathname !== '/points/create');

  const pointId = new URL(page.url()).pathname.split('/').pop();
  await page.goto(`/points/${pointId}/navigate`);
  await page.getByRole('button', { name: /ใช้ตำแหน่งฉัน/ }).click();
  await expect(page.getByText(/ไม่สามารถใช้ GPS จากการเชื่อมต่อนี้ได้/)).toBeVisible();
  await expect(page.getByText(/แตะบนแผนที่เพื่อเลือกตำแหน่งของคุณ/)).toBeVisible();

  const map = page.locator('.navigationMapCanvas');
  const box = await map.boundingBox();
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.42);

  await expect(page.locator('.leaflet-tooltip').filter({ hasText: 'ตำแหน่งฉัน' })).toBeVisible();
  await expect(page.locator('.navCompactStats .navStatItem strong').first()).not.toHaveText('ยังไม่ทราบ');
  await expect(page.locator('.navCompactStats .navStatItem strong').nth(1)).toHaveText('เลือกบนแผนที่');
});