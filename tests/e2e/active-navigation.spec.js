import { test, expect } from '@playwright/test';
import { pngFile, registerAndLogin } from './helpers.js';

async function installGeoMock(page, initialAccuracy = 6) {
  await page.addInitScript((accuracy) => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    let successWatcher = null;
    let errorWatcher = null;
    window.__pushGeo = (latitude, longitude, nextAccuracy = 6) => {
      successWatcher?.({ coords: { latitude, longitude, accuracy: nextAccuracy } });
    };
    window.__failGeo = (code = 2) => {
      errorWatcher?.({ code });
    };
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        watchPosition(success, error) {
          successWatcher = success;
          errorWatcher = error;
          setTimeout(() => success({ coords: { latitude: 13.7285, longitude: 100.7794, accuracy } }), 0);
          return 1;
        },
        clearWatch() {
          successWatcher = null;
          errorWatcher = null;
        },
      },
    });
  }, initialAccuracy);
}

async function createNavigationPoint(page, label) {
  await page.setViewportSize({ width: 390, height: 844 });
  await registerAndLogin(page, label);
  await page.goto('/points/create');

  const numberInputs = page.locator('input[type="number"]');
  await numberInputs.nth(0).fill('13.7291');
  await numberInputs.nth(1).fill('100.7789');
  await numberInputs.nth(2).fill('1');
  await page.locator('select').selectOption('DOG');
  await page.locator('textarea').fill(`${label} navigation point`);
  await page.locator('input[type="file"]').setInputFiles(pngFile);
  await page.getByRole('button', { name: 'สร้างจุดบนแผนที่' }).click();
  await page.waitForURL((url) => /^\/points\/[^/]+$/.test(url.pathname) && url.pathname !== '/points/create');

  const pointId = new URL(page.url()).pathname.split('/').pop();
  await page.goto(`/points/${pointId}/navigate`);
  await page.getByRole('button', { name: /ใช้ตำแหน่งฉัน/ }).click();
  await expect(page.locator('.navigation-road-route path').first()).toBeVisible();
  return pointId;
}

async function startActiveNavigation(page) {
  await expect(page.getByRole('button', { name: /เริ่มนำทาง/ })).toBeVisible();
  await page.getByRole('button', { name: /เริ่มนำทาง/ }).click();
  await expect(page.locator('.navActiveTopBar')).toBeVisible();
}

test('active navigation follows GPS, shows maneuver, recenters, and stops cleanly', async ({ page }) => {
  await installGeoMock(page);
  await createNavigationPoint(page, 'active-nav');
  await startActiveNavigation(page);

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

test('off-route GPS fixes trigger automatic rerouting and keep active navigation', async ({ page }) => {
  await installGeoMock(page);
  let routeRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/navigation/route?')) routeRequests += 1;
  });

  await createNavigationPoint(page, 'auto-reroute');
  await startActiveNavigation(page);
  expect(routeRequests).toBe(1);

  await page.evaluate(() => window.__pushGeo(13.7350, 100.7900, 6));
  await page.evaluate(() => window.__pushGeo(13.7351, 100.7901, 6));

  await expect.poll(() => routeRequests).toBeGreaterThanOrEqual(2);
  await expect(page.getByText('ปรับเส้นทางใหม่แล้ว')).toBeVisible();
  await expect(page.locator('.navActiveTopBar')).toBeVisible();
  await expect(page.locator('.navigation-road-route path').first()).toBeVisible();
});

test('poor GPS accuracy warns user and suppresses automatic rerouting', async ({ page }) => {
  await installGeoMock(page);
  let routeRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/navigation/route?')) routeRequests += 1;
  });

  await createNavigationPoint(page, 'poor-gps');
  await startActiveNavigation(page);
  expect(routeRequests).toBe(1);

  await page.evaluate(() => window.__pushGeo(13.7350, 100.7900, 120));
  await page.evaluate(() => window.__pushGeo(13.7352, 100.7902, 120));

  await expect(page.getByText(/GPS ความแม่นยำต่ำ/)).toBeVisible();
  await page.waitForTimeout(700);
  expect(routeRequests).toBe(1);
});

test('failed automatic reroute keeps old route and can recover with manual retry', async ({ page }) => {
  await installGeoMock(page);
  await createNavigationPoint(page, 'reroute-recovery');
  await startActiveNavigation(page);

  let failNextRoute = true;
  await page.route('**/api/navigation/route?**', async (route) => {
    if (failNextRoute) {
      failNextRoute = false;
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: { code: 'ROUTING_PROVIDER_ERROR', message: 'provider unavailable' } }),
      });
      return;
    }
    await route.continue();
  });

  await page.evaluate(() => window.__pushGeo(13.7350, 100.7900, 6));
  await page.evaluate(() => window.__pushGeo(13.7351, 100.7901, 6));

  await expect(page.getByText(/ปรับเส้นทางใหม่ไม่สำเร็จ/)).toBeVisible();
  await expect(page.locator('.navigation-road-route path')).toHaveCount(2);
  await page.getByRole('button', { name: 'ลองปรับเส้นทางอีกครั้ง' }).click();
  await expect(page.getByText('ปรับเส้นทางใหม่แล้ว')).toBeVisible();
  await expect(page.locator('.navActiveTopBar')).toBeVisible();
});

test('GPS loss pauses live tracking without discarding active route and can recover', async ({ page }) => {
  await installGeoMock(page);
  await createNavigationPoint(page, 'gps-recovery');
  await startActiveNavigation(page);

  await page.evaluate(() => window.__failGeo(2));
  await expect(page.getByText(/สัญญาณ GPS ไม่พร้อม/)).toBeVisible();
  await expect(page.locator('.navActiveTopBar')).toBeVisible();
  await expect(page.locator('.navigation-road-route path').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /ลอง GPS อีกครั้ง/ })).toBeVisible();

  await page.getByRole('button', { name: /ลอง GPS อีกครั้ง/ }).click();
  await expect(page.getByText(/สัญญาณ GPS ไม่พร้อม/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: /สิ้นสุดการนำทาง/ })).toBeVisible();
});

test('mobile navigation bottom sheet can collapse and expand without losing primary action', async ({ page }) => {
  await installGeoMock(page);
  await createNavigationPoint(page, 'sheet-collapse');

  await page.getByRole('button', { name: 'ย่อแผงข้อมูล' }).click();
  await expect(page.locator('.navBottomSheet')).toHaveClass(/navSheetCollapsed/);
  await expect(page.locator('.navModeTabs')).toBeHidden();
  await expect(page.getByRole('button', { name: /เริ่มนำทาง/ })).toBeVisible();

  await page.getByRole('button', { name: 'ขยายแผงข้อมูล' }).click();
  await expect(page.locator('.navBottomSheet')).not.toHaveClass(/navSheetCollapsed/);
  await expect(page.locator('.navModeTabs')).toBeVisible();
});
