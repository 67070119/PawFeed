import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers.js';

test('password reset arrives in local SMTP inbox and a used token cannot be reused', async ({ page, request }) => {
  test.skip(!process.env.MAILPIT_API_URL, 'Run scripts/test-e2e.sh for the local SMTP service');
  const { email, password } = await registerAndLogin(page, 'reset');
  await page.context().clearCookies();
  await page.goto('/forgot-password');
  await page.getByLabel('อีเมลที่ใช้สมัคร').fill(email);
  await page.getByRole('button', { name: 'ส่งลิงก์รีเซ็ตรหัสผ่าน' }).click();
  await expect(page.getByRole('status')).toBeVisible();
  let message;
  await expect.poll(async () => {
    const response = await request.get(`${process.env.MAILPIT_API_URL}/api/v1/messages`);
    const body = await response.json();
    message = body.messages.find(item => item.To.some(to => to.Address === email));
    return Boolean(message);
  }).toBe(true);
  const response = await request.get(`${process.env.MAILPIT_API_URL}/api/v1/message/${message.ID}`);
  const body = await response.json();
  const token = body.Text.match(/reset-password\?token=([a-f0-9]+)/)?.[1];
  expect(token).toBeTruthy();
  const newPassword = 'ChangedPassw0rd123';
  const reset = await request.post('/api/auth/reset-password', { data: { token, password: newPassword } });
  expect(reset.ok()).toBe(true);
  const reuse = await request.post('/api/auth/reset-password', { data: { token, password } });
  expect(reuse.status()).toBe(400);
  const oldLogin = await request.post('/api/auth/login', { data: { email, password } });
  expect(oldLogin.status()).toBe(401);
  const newLogin = await request.post('/api/auth/login', { data: { email, password: newPassword } });
  expect(newLogin.ok()).toBe(true);
});
