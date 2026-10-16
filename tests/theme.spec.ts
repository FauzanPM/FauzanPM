import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('switches palettes, preserves the choice on reload, and toggles back', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(245, 246, 238)');
  expect(await page.evaluate(() => localStorage.getItem('fauzanpm-theme'))).toBe('light');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible();
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(8, 13, 11)');
});

test('restores the saved palette before the application bundle loads', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('fauzanpm-theme', 'light'));
  await page.route('**/assets/*.js', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.locator('html').evaluate((html) => html.style.backgroundColor)).toBe(
    'rgb(245, 246, 238)',
  );
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f5f6ee');
  await expect(page.locator('#root')).toBeEmpty();
});

test('reveals the new palette outward from the actual toggle position', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  test.skip(
    !(await page.evaluate(() => typeof document.startViewTransition === 'function')),
    'This browser uses the separate fallback path.',
  );
  await expect(page.getByRole('button', { name: 'Explore Docker' })).toBeVisible();
  await page.evaluate(() => {
    window.addEventListener(
      'themechange',
      () => {
        const toggle = document.querySelector('.theme-toggle')!;
        const tool = document.querySelector('.orbital-tool')!;
        document.documentElement.dataset.capturedPalette = JSON.stringify({
          toggle: getComputedStyle(toggle).backgroundColor,
          tool: getComputedStyle(tool).backgroundColor,
        });
      },
      { once: true },
    );
  });
  const button = page.getByRole('button', { name: 'Switch to light mode' });
  const bounds = (await button.boundingBox())!;
  await button.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme-transition', 'radial');
  const capturedPalette = await page.locator('html').getAttribute('data-captured-palette');
  expect(JSON.parse(capturedPalette!)).toEqual({
    toggle: 'rgb(252, 253, 248)',
    tool: 'rgba(251, 253, 245, 0.95)',
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        document.getAnimations().some((animation) => {
          const effect = animation.effect;
          return (
            effect instanceof KeyframeEffect &&
            effect.pseudoElement === '::view-transition-new(root)' &&
            effect.getKeyframes().some((frame) => String(frame.clipPath).startsWith('circle(0px'))
          );
        }),
      ),
    )
    .toBe(true);
  const origin = await page.locator('html').evaluate((html) => ({
    x: parseFloat(html.style.getPropertyValue('--theme-origin-x')),
    y: parseFloat(html.style.getPropertyValue('--theme-origin-y')),
  }));
  expect(origin.x).toBeCloseTo(bounds.x + bounds.width / 2, 0);
  expect(origin.y).toBeCloseTo(bounds.y + bounds.height / 2, 0);
  await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition');
  await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeEnabled();
});

test('uses a smooth wave fallback when view transitions are unavailable', async ({
  page,
  isMobile,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'startViewTransition', { value: undefined });
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Infrastructure', exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => scrollTo({ top: 900, behavior: 'instant' }));
  const scrollBefore = await page.evaluate(() => scrollY);
  const bounds = (await page.getByRole('button', { name: 'Switch to light mode' }).boundingBox())!;
  // A real viewport click does not invoke locator.click's automatic scrolling of a sticky header.
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  if (isMobile) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
  const transition = await page.evaluate(() => ({
    mode: document.documentElement.dataset.themeTransition,
    wave: !!document.querySelector('.theme-wave'),
    duration: getComputedStyle(document.body).transitionDuration,
  }));
  expect(transition.mode).toBe('fallback');
  expect(transition.wave).toBe(true);
  expect(transition.duration).toContain('0.7s');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition');
  await expect(page.locator('.theme-wave')).toHaveCount(0);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(245, 246, 238)');
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(scrollBefore, 0);
});

test('respects reduced motion and works when storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage unavailable', 'SecurityError');
      },
    });
    document.startViewTransition = () => {
      throw new Error('Reduced motion must not start a snapshot animation');
    };
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition');
  await expect(page.locator('.theme-wave')).toHaveCount(0);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(245, 246, 238)');
  expect(errors).toEqual([]);
});

test('light palette passes WCAG AA checks on the page and project and command dialogs', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('fauzanpm-theme', 'light'));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Infrastructure', exact: true })).toBeVisible();
  const audit = async () => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  };
  await audit();
  await page.getByRole('button', { name: 'Explore DumbMerch project' }).click();
  await expect(page.getByRole('dialog', { name: 'DumbMerch case study' })).toBeVisible();
  await audit();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Open command menu' }).click();
  await expect(page.getByRole('combobox', { name: 'Search commands' })).toBeVisible();
  await audit();
});
