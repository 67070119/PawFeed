import { test, expect } from '@playwright/test';
import { fillCreatePointForm, registerAndLogin } from './helpers.js';

test('critical user flow works end-to-end', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        watchPosition(success) {
          setTimeout(() => success({ coords: { latitude: 13.7285, longitude: 100.7794, accuracy: 7 } }), 0);
          return 1;
        },
        clearWatch() {},
        getCurrentPosition(success) {
          setTimeout(() => success({ coords: { latitude: 13.7285, longitude: 100.7794, accuracy: 7 } }), 0);
        },
      },
    });
  });

  await registerAndLogin(page, 'critical');

  await page.goto('/points/create');
  await expect(page.getByRole('heading', { name: 'เพิ่มจุดสัตว์จรจัด' })).toBeVisible();
  await fillCreatePointForm(page, {
    description: 'E2E stray point near building A',
    count: '3',
    animalType: 'DOG',
    startTime: '17:00',
    endTime: '20:00',
  });
  await page.getByRole('button', { name: 'สร้างจุดบนแผนที่' }).click();

  await page.waitForURL(/\/points\/[^/]+$/);
  await expect(page.getByText('E2E stray point near building A')).toBeVisible();

  const navigation = page.getByRole('link', { name: /นำทางไปจุดนี้/ });
  await expect(navigation).toHaveAttribute('href', /\/points\/[^/]+\/navigate$/);
  await navigation.click();
  await page.waitForURL(/\/points\/[^/]+\/navigate$/);
  await expect(page.locator('.navigationMapCanvas')).toBeVisible();
  await expect(page.locator('.navBottomSheet')).toBeVisible();
  await expect(page.locator('.navigation-road-route path').first()).toBeVisible();
  const routeEta = page.locator('.navSheetHeaderSimple h1');
  const routeDistance = page.locator('.navDistanceSummary strong');
  await expect(routeEta).toHaveText(/\d/);
  await expect(routeEta).not.toHaveText('—');
  await expect(routeDistance).toHaveText(/\d/);
  await expect(routeDistance).not.toHaveText('—');
  await expect(page.getByText(/ตำแหน่งปัจจุบัน · เส้นทางตามถนน · OSRM/)).toBeVisible();

  const walkingMode = page.getByRole('button', { name: 'เดิน' });
  await walkingMode.click();
  await expect(walkingMode).toHaveAttribute('aria-pressed', 'true');
  await expect(routeEta).toHaveText(/\d/);
  await expect(routeDistance).toHaveText(/\d/);

  const cyclingMode = page.getByRole('button', { name: 'จักรยาน' });
  await cyclingMode.click();
  await expect(cyclingMode).toHaveAttribute('aria-pressed', 'true');
  await expect(routeEta).toHaveText(/\d/);
  await expect(routeDistance).toHaveText(/\d/);

  await page.getByRole('link', { name: 'กลับรายละเอียดจุด' }).click();
  await page.waitForURL(/\/points\/[^/]+$/);

  await page.getByLabel(/หมายเหตุ/).fill('E2E feeding note');
  await page.getByRole('button', { name: /ฉันให้อาหารแล้ว/ }).click();
  await expect(page.getByText('บันทึกการให้อาหารแล้ว')).toBeVisible();
  await expect(page.getByText('E2E feeding note')).toBeVisible();

  await page.getByRole('button', { name: /ยังพบสัตว์อยู่/ }).click();
  await expect(page.getByText('ยืนยันว่าพบสัตว์อยู่แล้ว')).toBeVisible();

  await page.goto('/profile/points');
  await expect(page.getByText('E2E stray point near building A')).toBeVisible();

  await page.goto('/profile/feedings');
  await expect(page.getByText('E2E feeding note')).toBeVisible();

  await page.goto('/');
  const marker = page.locator('.leaflet-marker-icon:has(.mapAnimalMarker)').first();
  await expect(marker).toBeVisible();
  await marker.click({ force: true });
  await expect(page.getByRole('link', { name: /ดูรายละเอียด/ })).toBeVisible();
});
