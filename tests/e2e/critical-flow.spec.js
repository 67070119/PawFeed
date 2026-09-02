import { test, expect } from '@playwright/test';
import { pngFile, registerAndLogin } from './helpers.js';

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

  const numberInputs = page.locator('input[type="number"]');
  await numberInputs.nth(0).fill('13.7291');
  await numberInputs.nth(1).fill('100.7789');
  await numberInputs.nth(2).fill('3');
  await page.locator('select').selectOption('DOG');
  await page.locator('textarea').fill('E2E stray point near building A');
  await page.locator('input[placeholder="เช่น 17:00 - 20:00"]').fill('17:00 - 20:00');
  await page.locator('input[type="file"]').setInputFiles(pngFile);
  await page.getByRole('button', { name: 'สร้างจุดบนแผนที่' }).click();

  await page.waitForURL(/\/points\/[^/]+$/);
  await expect(page.getByText('E2E stray point near building A')).toBeVisible();
  const navigation = page.getByRole('link', { name: /นำทางใน PawFeed/ });
  await expect(navigation).toHaveAttribute('href', /\/points\/[^/]+\/navigate$/);
  await navigation.click();
  await page.waitForURL(/\/points\/[^/]+\/navigate$/);
  await expect(page.getByRole('heading', { name: 'เลือกตำแหน่งเริ่มต้น' })).toBeVisible();
  await expect(page.locator('.navigationMapCanvas')).toBeVisible();
  await expect(page.locator('.navRouteCard')).toBeVisible();
  await expect(page.locator('.navBottomSheet')).toBeVisible();
  await page.getByRole('button', { name: /ใช้ตำแหน่งฉัน/ }).click();
  await expect(page.locator('.leaflet-tooltip').filter({ hasText: 'ตำแหน่งฉัน' })).toBeVisible();
  await expect(page.locator('.navigation-road-route path').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: '5 นาที' })).toBeVisible();
  await expect(page.locator('.navDistanceSummary strong')).toHaveText('2.5 กม.');
  await expect(page.getByText('เส้นทางตามถนน · OSRM')).toBeVisible();
  await page.getByRole('button', { name: /เดิน/ }).click();
  await expect(page.getByRole('heading', { name: '25 นาที' })).toBeVisible();
  await page.getByRole('button', { name: /จักรยาน/ }).click();
  await expect(page.getByRole('heading', { name: '8 นาที' })).toBeVisible();
  await page.getByRole('link', { name: /กลับรายละเอียดจุด/ }).click();
  await page.waitForURL(/\/points\/[^/]+$/);

  await page.locator('textarea').fill('E2E feeding note');
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
  const marker = page.locator('.leaflet-marker-icon').first();
  await expect(marker).toBeVisible();
  await marker.click({ force: true });
  await expect(page.getByRole('link', { name: 'ดูรายละเอียด' })).toBeVisible();
});
