import { test, expect } from '@playwright/test';
import { pngFile, registerAndLogin } from './helpers.js';

test('active navigation follows GPS, shows maneuver, recenters, and stops cleanly', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    let watcher = null;
    window.__pushGeo = (latitude, longitude, accuracy = 6) => {
      watcher?.({ coords: { latitude, longitude, accuracy } });
    };
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        watchPosition(success) {
          watcher = success;
          setTimeout(() => success({ coords: { latitude: 13.7285, longitude: 100.7794, accuracy: 6 } }), 0);
          return 1;
        },
        clearWatch() {
          watcher = null;
        },
      },
    });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await registerAndLogin(page, 'active-nav');
  await page.goto('/points/create');

  const numberInputs = page.locator('input[type="number"]');
  await numberInputs.nth(0).fill('13.7291');
  await numberInputs.nth(1).fill('100.7789');
  await numberInputs.nth(2).fill('1');
  await page.locator('select').selectOption('DOG');
  await page.locator('textarea').fill('Active navigation point');
  await page.locator('input[type="file"]').setInputFiles(pngFile);
  await page.getByRole('button', { name: 'สร้างจุดบนแผนที่' }).click();
  await page.waitForURL((url) => /^\/points\/[^/]+$/.test(url.pathname) && url.pathname !== '/points/create');

  const pointId = new URL(page.url()).pathname.split('/').pop();
  await page.goto(`/points/${pointId}/navigate`);
  await page.getByRole('button', { name: /ใช้ตำแหน่งฉัน/ }).click();
  await expect(page.locator('.navigation-road-route path').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /เริ่มนำทาง/ })).toBeVisible();

  await page.getByRole('button', { name: /เริ่มนำทาง/ }).click();
  await expect(page.locator('.navActiveTopBar')).toBeVisible();
  await expect(page.locator('.navManeuverCopy strong')).toContainText('เลี้ยวขวา');
  await expect(page.locator('.navActiveSheet')).toBeVisible();
  await expect(page.getByRole('button', { name: /สิ้นสุดการนำทาง/ })).toBeVisible();

  const remaining = page.locator('.navDistanceSummary strong');
  const initialRemaining = await remaining.textContent();

  const map = page.locator('.navigationMapCanvas');
  const box = await map.boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.45);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.55, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByText(/คุณเลื่อนแผนที่แล้ว/)).toBeVisible();
  await page.getByRole('button', { name: 'กลับมาติดตามตำแหน่งฉัน' }).click();
  await expect(page.getByText(/คุณเลื่อนแผนที่แล้ว/)).toHaveCount(0);

  await page.evaluate(() => window.__pushGeo(13.7298, 100.78015, 5));
  await expect(page.locator('.navManeuverCopy strong')).toHaveText('ไปถึงจุดหมาย');
  await expect.poll(async () => remaining.textContent()).not.toBe(initialRemaining);

  await page.evaluate(() => window.__pushGeo(13.7291, 100.7789, 4));
  await expect(page.locator('.navManeuverCopy strong')).toHaveText('ถึงจุดหมายแล้ว');
  await expect(remaining).toHaveText('0 ม.');

  await page.getByRole('button', { name: /สิ้นสุดการนำทาง/ }).click();
  await expect(page.locator('.navActiveTopBar')).toHaveCount(0);
  await expect(page.locator('.navModeTabs')).toBeVisible();
  await expect(page.getByRole('button', { name: /เริ่มนำทาง/ })).toBeVisible();
});
