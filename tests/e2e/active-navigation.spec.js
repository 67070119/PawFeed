import { test, expect } from '@playwright/test';
import { fillCreatePointForm, registerAndLogin } from './helpers.js';

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
  await fillCreatePointForm(page, {
    description: `${label} navigation point`,
    count: '1',
    animalType: 'DOG',
  });
  await page.getByRole('button', { name: 'สร้างจุดบนแผนที่' }).click();
  await page.waitForURL((url) => /^\/points\/[^/]+$/.test(url.pathname) && url.pathname !== '/points/create');

  const pointId = new URL(page.url()).pathname.split('/').pop();
  await page.goto(`/points/${pointId}/navigate`);
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
  const pointId = await createNavigationPoint(page, 'active-nav');
  const pointResponse = await page.request.get(`/api/points/${pointId}`);
  const point = (await pointResponse.json()).data;
  await startActiveNavigation(page);

  await expect(page.locator('.navManeuverCopy strong')).toHaveText(/\S+/);
  await expect(page.locator('.navActiveSheet')).toBeVisible();
  await expect(page.getByText('ตำแหน่งใช้เฉพาะระหว่างนำทางและไม่เก็บเป็นประวัติ')).toBeVisible();
  await expect(page.getByRole('button', { name: /สิ้นสุดการนำทาง/ })).toBeVisible();

  const remaining = page.locator('.navDistanceSummary strong');
  const initialRemaining = await remaining.textContent();

  const map = page.locator('.navigationMapCanvas');
  // Leaflet ignores drags while its initial pan/zoom animation is in progress.
  await expect(map.locator('.leaflet-pan-anim, .leaflet-zoom-anim')).toHaveCount(0);
  // The map centre contains the user marker/accuracy layer; drag unobscured
  // background rather than a marker or one of the navigation overlays.
  const drag = await map.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const backgroundAt = (x, y) => {
      const target = document.elementFromPoint(x, y);
      return target && element.contains(target)
        && !target.closest('.leaflet-interactive, .leaflet-control');
    };
    for (const row of [0.35, 0.45, 0.25, 0.55]) {
      for (const column of [0.2, 0.6, 0.35]) {
        const start = { x: box.x + box.width * column, y: box.y + box.height * row };
        const end = { x: start.x + box.width * 0.15, y: start.y + 30 };
        if (backgroundAt(start.x, start.y) && backgroundAt(end.x, end.y)) return { start, end };
      }
    }
    throw new Error('No unobscured map background available for dragging');
  });
  await page.mouse.move(drag.start.x, drag.start.y);
  await page.mouse.down();
  await page.mouse.move(drag.end.x, drag.end.y, { steps: 10 });
  await page.mouse.up();
  await expect(page.getByText(/คุณเลื่อนแผนที่แล้ว/)).toBeVisible();
  await page.getByRole('button', { name: 'กลับมาติดตามตำแหน่งฉัน' }).click();
  await expect(page.getByText(/คุณเลื่อนแผนที่แล้ว/)).toHaveCount(0);

  await page.evaluate(() => window.__pushGeo(13.7298, 100.78015, 5));
  await expect.poll(async () => remaining.textContent()).not.toBe(initialRemaining);
  await expect(page.locator('.navActiveTopBar')).toBeVisible();

  await page.evaluate(({ latitude, longitude }) => window.__pushGeo(latitude, longitude, 4), {
    latitude: Number(point.latitude),
    longitude: Number(point.longitude),
  });
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

  const pointId = await createNavigationPoint(page, 'auto-reroute');
  const pointResponse = await page.request.get(`/api/points/${pointId}`);
  const point = (await pointResponse.json()).data;
  await startActiveNavigation(page);
  expect(routeRequests).toBe(1);

  const farPosition = { latitude: Number(point.latitude) + 0.02, longitude: Number(point.longitude) + 0.02 };
  // The app requires two separately processed off-route fixes. Wait for the
  // first fix to render so React cannot batch both mock callbacks into one fix.
  // Accuracy stays in the "good" GPS range; its change acknowledges the fix.
  await page.evaluate(({ latitude, longitude }) => window.__pushGeo(latitude, longitude, 7), farPosition);
  await expect(page.locator('.navGpsPill strong')).toHaveText('±7 ม.');
  await page.evaluate(({ latitude, longitude }) => window.__pushGeo(latitude + 0.0001, longitude + 0.0001, 6), farPosition);

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
  let failedRouteRequests = 0;
  await page.route('**/api/navigation/route?**', async (route) => {
    if (failNextRoute) {
      failNextRoute = false;
      failedRouteRequests += 1;
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: { code: 'ROUTING_PROVIDER_ERROR', message: 'provider unavailable' } }),
      });
      return;
    }
    await route.continue();
  });

  // Distinct rendered fixes trigger the real two-fix guard even on a busy CI
  // browser; two consecutive page.evaluate calls can otherwise be batched.
  await page.evaluate(() => window.__pushGeo(13.7350, 100.7900, 7));
  await expect(page.locator('.navGpsPill strong')).toHaveText('±7 ม.');
  expect(failedRouteRequests).toBe(0);
  await page.evaluate(() => window.__pushGeo(13.7351, 100.7901, 6));

  await expect.poll(() => failedRouteRequests).toBe(1);
  await expect(page.getByText(/ปรับเส้นทางไม่สำเร็จ/)).toBeVisible();
  await expect(page.locator('.navigation-road-route path')).toHaveCount(2);
  await page.getByRole('button', { name: 'ลองอีกครั้ง' }).click();
  await expect(page.getByText('ปรับเส้นทางใหม่แล้ว')).toBeVisible();
  await expect(page.locator('.navActiveTopBar')).toBeVisible();
});

test('GPS loss pauses live tracking without discarding active route and can recover', async ({ page }) => {
  await installGeoMock(page);
  await createNavigationPoint(page, 'gps-recovery');
  await startActiveNavigation(page);

  await page.evaluate(() => window.__failGeo(2));
  await expect(page.getByText(/ไม่พบสัญญาณ GPS/)).toBeVisible();
  await expect(page.locator('.navActiveTopBar')).toBeVisible();
  await expect(page.locator('.navigation-road-route path').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /ลอง GPS อีกครั้ง/ })).toBeVisible();

  await page.getByRole('button', { name: /ลอง GPS อีกครั้ง/ }).click();
  await expect(page.getByText(/ไม่พบสัญญาณ GPS/)).toHaveCount(0);
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

test('navigation layout stays usable across common mobile portrait viewports', async ({ page }) => {
  await installGeoMock(page);
  await createNavigationPoint(page, 'mobile-layout');

  const viewports = [
    { width: 375, height: 667 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await expect(page.locator('.navTopBar')).toBeVisible();
    await expect(page.locator('.navBottomSheet')).toBeVisible();
    await expect(page.getByRole('button', { name: /เริ่มนำทาง/ })).toBeVisible();

    const layout = await page.evaluate(() => {
      const top = document.querySelector('.navTopBar').getBoundingClientRect();
      const sheet = document.querySelector('.navBottomSheet').getBoundingClientRect();
      return {
        noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
        topBottom: top.bottom,
        sheetTop: sheet.top,
        sheetRight: sheet.right,
        viewportWidth: window.innerWidth,
      };
    });

    expect(layout.noHorizontalOverflow).toBe(true);
    expect(layout.topBottom).toBeLessThan(layout.sheetTop);
    expect(layout.sheetRight).toBeLessThanOrEqual(layout.viewportWidth + 1);
  }

  await startActiveNavigation(page);
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await expect(page.locator('.navActiveTopBar')).toBeVisible();
    await expect(page.locator('.navActiveSheet')).toBeVisible();
    await expect(page.getByRole('button', { name: /สิ้นสุดการนำทาง/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'กลับมาติดตามตำแหน่งฉัน' })).toBeVisible();

    const layout = await page.evaluate(() => {
      const top = document.querySelector('.navActiveTopBar').getBoundingClientRect();
      const sheet = document.querySelector('.navActiveSheet').getBoundingClientRect();
      return {
        noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
        topBottom: top.bottom,
        sheetTop: sheet.top,
      };
    });

    expect(layout.noHorizontalOverflow).toBe(true);
    expect(layout.topBottom).toBeLessThan(layout.sheetTop);
  }
});
