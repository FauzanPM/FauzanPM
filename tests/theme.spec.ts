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

test('keeps canvas colors and globe position stable until both theme reveals finish', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  test.skip(
    !(await page.evaluate(() => typeof document.startViewTransition === 'function')),
    'This browser uses the separate fallback path.',
  );
  await expect(page.getByRole('button', { name: 'Explore Docker' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    const root = document.documentElement;
    const native = document.startViewTransition.bind(document);
    const checks: { theme: string; maxGreen: number; earlyCleanup: boolean; stable: boolean }[] =
      [];
    const positions = () =>
      Array.from(document.querySelectorAll<HTMLElement>('.orbital-tool-anchor')).map(
        (element) => element.style.transform,
      );
    document.startViewTransition = (callback) => {
      let settled = false;
      let snapshot: string[] = [];
      const check = { theme: '', maxGreen: 0, earlyCleanup: false, stable: false };
      const transition = native(async () => {
        if (typeof callback === 'function') await callback();
        check.theme = root.dataset.theme!;
        snapshot = positions();
        const canvas = document.querySelector<HTMLCanvasElement>('.scene-orbit canvas')!;
        const pixels = canvas
          .getContext('2d')!
          .getImageData(0, 0, canvas.width, canvas.height).data;
        for (let index = 0; index < pixels.length; index += 4) {
          if (pixels[index + 3] > 100) check.maxGreen = Math.max(check.maxGreen, pixels[index + 1]);
        }
      });
      void transition.finished.then(() => {
        settled = true;
      });
      const observer = new MutationObserver(() => {
        if (root.hasAttribute('data-theme-transition')) return;
        check.earlyCleanup = !settled;
        check.stable = JSON.stringify(positions()) === JSON.stringify(snapshot);
        checks.push(check);
        root.dataset.revealChecks = JSON.stringify(checks);
        observer.disconnect();
      });
      observer.observe(root, { attributes: true, attributeFilter: ['data-theme-transition'] });
      return transition;
    };
  });

  for (const theme of ['light', 'dark']) {
    await page.getByRole('button', { name: `Switch to ${theme} mode` }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition');
  }
  const checks = JSON.parse((await page.locator('html').getAttribute('data-reveal-checks'))!);
  expect(checks).toHaveLength(2);
  expect(checks[0]).toMatchObject({ theme: 'light', earlyCleanup: false, stable: true });
  expect(checks[0].maxGreen).toBeGreaterThan(0);
  expect(checks[0].maxGreen).toBeLessThan(150);
  expect(checks[1]).toMatchObject({ theme: 'dark', earlyCleanup: false, stable: true });
  expect(checks[1].maxGreen).toBeGreaterThan(200);
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
