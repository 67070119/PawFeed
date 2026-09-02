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

export const pngFile = {
  name: 'pawfeed-e2e.png',
  mimeType: 'image/png',
  buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00]),
};
