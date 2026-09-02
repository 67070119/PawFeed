import { test, expect } from '@playwright/test';
import { pngFile, registerAndLogin } from './helpers.js';

test('critical user flow works end-to-end', async ({ page }) => {
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
  const navigation = page.getByRole('link', { name: /นำทางด้วย Google Maps/ });
  await expect(navigation).toHaveAttribute('href', /google\.com\/maps\/dir/);

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
});
