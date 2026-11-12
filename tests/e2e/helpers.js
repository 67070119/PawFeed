import { expect } from '@playwright/test';

export async function registerAndLogin(page, label = 'e2e') {
  const email = `${label}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
  const password = 'Passw0rd123';

  await page.goto('/register');
  const registerInputs = page.locator('input');
  await registerInputs.nth(0).fill('E2E User');
  await registerInputs.nth(1).fill(email);
  await registerInputs.nth(2).fill(password);
  await registerInputs.nth(3).fill(password);
  await page.getByRole('button', { name: 'สร้างบัญชี' }).click();
  await page.waitForURL('**/login');

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await page.waitForURL((url) => url.pathname === '/');

  return { email, password };
}

export async function selectCreatePointLocation(page) {
  await page.getByRole('button', { name: /เลือกตำแหน่งบนแผนที่|เปลี่ยนตำแหน่งบนแผนที่/ }).click();
  const dialog = page.getByRole('dialog', { name: 'เลือกตำแหน่งที่พบสัตว์' });
  await dialog.waitFor({ state: 'visible' });

  const map = dialog.locator('.mapPickerCanvas');
  await map.waitFor({ state: 'visible' });
  const box = await map.boundingBox();
  if (!box) throw new Error('Create-point map picker has no bounding box');

  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.45);
  await page.getByRole('button', { name: 'ยืนยันตำแหน่งนี้' }).click();
  await page.getByText('เลือกตำแหน่งแล้ว').waitFor({ state: 'visible' });
}

export async function fillCreatePointForm(page, {
  description,
  count = '1',
  animalType = 'DOG',
  customAnimal,
  image = pngFile,
  startTime,
  endTime,
} = {}) {
  await selectCreatePointLocation(page);
  await page.getByLabel(/จำนวนโดยประมาณ/).fill(String(count));
  const animalNames = { DOG: /สุนัข/, CAT: /แมว/, OTHER: /สัตว์อื่น/ };
  if (!animalNames[animalType]) throw new Error(`Unsupported animal type: ${animalType}`);
  const animalOption = page.getByRole('radiogroup', { name: 'เลือกประเภทสัตว์' })
    .getByRole('radio', { name: animalNames[animalType] });
  await animalOption.click();
  await expect(animalOption).toHaveAttribute('aria-checked', 'true');
  if (customAnimal != null) await page.getByLabel('ระบุชนิดสัตว์ที่พบ').fill(customAnimal);
  if (description != null) await page.getByLabel(/คำอธิบาย/).fill(description);
  if (startTime != null) await page.getByRole('textbox', { name: 'เวลาเริ่ม', exact: true }).fill(startTime);
  if (endTime != null) await page.getByRole('textbox', { name: 'เวลาสิ้นสุด', exact: true }).fill(endTime);
  if (startTime != null || endTime != null) {
    // Dismiss the time picker as a user would before submitting the form.
    await page.keyboard.press('Escape');
    await expect(page.locator('.timePickerPopover')).toHaveCount(0);
    if (startTime != null) await expect(page.getByRole('textbox', { name: 'เวลาเริ่ม', exact: true })).toHaveValue(startTime);
    if (endTime != null) await expect(page.getByRole('textbox', { name: 'เวลาสิ้นสุด', exact: true })).toHaveValue(endTime);
  }
  if (image) await page.locator('input[type="file"]').setInputFiles(image);
}

export const pngFile = {
  name: 'pawfeed-e2e.png',
  mimeType: 'image/png',
  buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00]),
};
