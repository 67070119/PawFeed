import { test, expect } from '@playwright/test';
import { fillCreatePointForm, registerAndLogin } from './helpers.js';

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(
    metrics.scrollWidth,
    `page should not overflow horizontally: ${metrics.scrollWidth}px > ${metrics.viewportWidth}px`,
  ).toBeLessThanOrEqual(metrics.viewportWidth + 1);
}

async function expectUsableInViewport(locator, { scroll = true } = {}) {
  await expect(locator).toBeVisible();
  if (scroll) await locator.scrollIntoViewIfNeeded();

  const geometry = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const centerX = Math.min(window.innerWidth - 1, Math.max(0, rect.left + rect.width / 2));
    const centerY = Math.min(window.innerHeight - 1, Math.max(0, rect.top + rect.height / 2));
    const topElement = document.elementFromPoint(centerX, centerY);

    return {
      rect: {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      unobscured: Boolean(topElement && (topElement === element || element.contains(topElement))),
    };
  });

  expect(geometry.rect.top).toBeGreaterThanOrEqual(-1);
  expect(geometry.rect.left).toBeGreaterThanOrEqual(-1);
  expect(geometry.rect.bottom).toBeLessThanOrEqual(geometry.viewport.height + 1);
  expect(geometry.rect.right).toBeLessThanOrEqual(geometry.viewport.width + 1);
  expect(geometry.rect.width).toBeGreaterThan(0);
  expect(geometry.rect.height).toBeGreaterThanOrEqual(44);
  expect(geometry.unobscured).toBe(true);
}

async function installGeoMock(page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        watchPosition(success) {
          setTimeout(() => success({
            coords: { latitude: 13.7285, longitude: 100.7794, accuracy: 6 },
          }), 0);
          return 1;
        },
        clearWatch() {},
        getCurrentPosition(success) {
          setTimeout(() => success({
            coords: { latitude: 13.7285, longitude: 100.7794, accuracy: 6 },
          }), 0);
        },
      },
    });
  });
}

async function createNavigationPoint(page, label) {
  await page.setViewportSize({ width: 390, height: 844 });
  await registerAndLogin(page, label);
  await page.goto('/points/create');
  await fillCreatePointForm(page, {
    description: `${label} responsive guard point`,
    count: '1',
    animalType: 'DOG',
  });
  await page.getByRole('button', { name: 'สร้างจุดบนแผนที่' }).click();
  await page.waitForURL((url) => /^\/points\/[^/]+$/.test(url.pathname) && url.pathname !== '/points/create');

  return new URL(page.url()).pathname.split('/').pop();
}

test('auth primary actions stay reachable on narrow and short viewports', async ({ page }) => {
  const cases = [
    { route: '/login', viewport: { width: 320, height: 568 }, selector: '.authSubmit' },
    { route: '/register', viewport: { width: 320, height: 568 }, selector: '.authSubmit' },
  ];

  for (const item of cases) {
    await page.setViewportSize(item.viewport);
    await page.goto(item.route);
    await expectNoHorizontalOverflow(page);

    const primary = page.locator(item.selector);
    await expectUsableInViewport(primary, { scroll: false });
  }

  await page.setViewportSize({ width: 390, height: 500 });
  await page.goto('/register');
  const confirmPassword = page.locator('#register-confirm');
  await confirmPassword.focus();
  await confirmPassword.evaluate((element) => element.scrollIntoView({ block: 'center' }));

  const overlap = await page.evaluate(() => {
    const field = document.querySelector('#register-confirm').getBoundingClientRect();
    const submit = document.querySelector('.authSubmit').getBoundingClientRect();
    return submit.top < field.bottom && submit.bottom > field.top;
  });

  expect(overlap).toBe(false);
  await expectUsableInViewport(page.locator('.authSubmit'), { scroll: false });
});

test('shared mobile routes do not introduce page-level horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await registerAndLogin(page, 'responsive-overflow');

  const protectedRoutes = [
    '/',
    '/points/create',
    '/profile',
    '/profile/points',
    '/profile/feedings',
  ];

  for (const route of protectedRoutes) {
    await page.goto(route);
    await expectNoHorizontalOverflow(page);
  }

  await page.goto('/points/create');
  await expectUsableInViewport(page.getByRole('button', { name: /เลือกตำแหน่งบนแผนที่/ }));
  await expectUsableInViewport(page.getByRole('button', { name: 'สร้างจุดบนแผนที่' }));

  await page.goto('/profile');
  await expectUsableInViewport(page.getByRole('link', { name: /เพิ่มจุดใหม่/ }));
});

test('create-point map picker keeps its footer action inside portrait and landscape viewports', async ({ page }) => {
  await registerAndLogin(page, 'responsive-picker');

  const viewports = [
    { width: 390, height: 844 },
    { width: 667, height: 375 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/points/create');

    const opener = page.getByRole('button', { name: /เลือกตำแหน่งบนแผนที่|เปลี่ยนตำแหน่งบนแผนที่/ });
    await opener.click();

    const dialog = page.getByRole('dialog', { name: 'เลือกตำแหน่งที่พบสัตว์' });
    await expect(dialog).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const layout = await page.evaluate(() => {
      const overlay = document.querySelector('.locationPickerOverlay').getBoundingClientRect();
      const footer = document.querySelector('.locationPickerFooter').getBoundingClientRect();
      const scrollables = [...document.querySelectorAll('.locationPickerOverlay *')].filter((element) => {
        const style = getComputedStyle(element);
        return ['auto', 'scroll'].includes(style.overflowY)
          && element.scrollHeight > element.clientHeight + 4;
      });

      return {
        overlayTop: overlay.top,
        overlayBottom: overlay.bottom,
        footerBottom: footer.bottom,
        viewportHeight: window.innerHeight,
        nestedScrollerCount: scrollables.length,
      };
    });

    expect(layout.overlayTop).toBeGreaterThanOrEqual(-1);
    expect(layout.overlayBottom).toBeLessThanOrEqual(layout.viewportHeight + 1);
    expect(layout.footerBottom).toBeLessThanOrEqual(layout.viewportHeight + 1);
    expect(layout.nestedScrollerCount).toBe(0);

    await expectUsableInViewport(page.getByRole('button', { name: 'ยืนยันตำแหน่งนี้' }), { scroll: false });

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  }
});

test('navigation keeps its primary action reachable when expanded or collapsed', async ({ page }) => {
  await installGeoMock(page);
  const pointId = await createNavigationPoint(page, 'responsive-navigation');
  await page.goto(`/points/${pointId}/navigate`);
  await expect(page.locator('.navigation-road-route path').first()).toBeVisible();

  const viewports = [
    { width: 320, height: 568 },
    { width: 667, height: 375 },
    { width: 844, height: 390 },
    { width: 932, height: 430 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await expectNoHorizontalOverflow(page);

    const start = page.getByRole('button', { name: /เริ่มนำทาง/ });
    await expect(start).toBeEnabled();
    await expectUsableInViewport(start, { scroll: false });

    const collapse = page.getByRole('button', { name: 'ย่อแผงข้อมูล' });
    await expectUsableInViewport(collapse, { scroll: false });
    await collapse.click();

    const sheet = page.locator('.navBottomSheet');
    await expect(sheet).toHaveClass(/navSheetCollapsed/);
    await expect(page.locator('.navModeTabs')).toBeHidden();

    const collapsedStart = page.getByRole('button', { name: /เริ่มนำทาง/ });
    await expectUsableInViewport(collapsedStart, { scroll: false });

    const expand = page.getByRole('button', { name: 'ขยายแผงข้อมูล' });
    await expectUsableInViewport(expand, { scroll: false });
    await expand.click();

    await expect(sheet).not.toHaveClass(/navSheetCollapsed/);
    await expectUsableInViewport(page.getByRole('button', { name: /เริ่มนำทาง/ }), { scroll: false });
  }
});
