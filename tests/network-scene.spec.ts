import { expect, test, type Locator, type Page } from '@playwright/test';

const technologyNames = [
  'AWS',
  'Docker',
  'Kubernetes',
  'Terraform',
  'Ansible',
  'Jenkins',
  'Prometheus',
  'Grafana',
];

const orbitGroup = (page: Page) =>
  page.getByRole('group', { name: 'Rotate technology globe', exact: true });

async function projection(page: Page) {
  return page.locator('.orbital-tool-anchor').evaluateAll((anchors) =>
    anchors.map((anchor) => ({
      id: anchor.getAttribute('data-tool-id'),
      transform: (anchor as HTMLElement).style.transform,
    })),
  );
}

async function openGlobe(page: Page) {
  await page.clock.install();
  await page.goto('/');
  const orbit = orbitGroup(page);
  await orbit.scrollIntoViewIfNeeded();
  await page.clock.runFor(100);
  await expect(page.locator('.orbital-tool-anchor')).toHaveCount(technologyNames.length);
  await expect
    .poll(async () => (await projection(page)).every((node) => node.transform.length > 0))
    .toBe(true);
  return orbit;
}

async function emptyPoint(orbit: Locator) {
  return orbit.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    for (const [horizontal, vertical] of [
      [0.5, 0.5],
      [0.3, 0.45],
      [0.65, 0.4],
      [0.25, 0.65],
      [0.7, 0.65],
    ]) {
      const x = rect.left + rect.width * horizontal;
      const y = rect.top + rect.height * vertical;
      const target = document.elementFromPoint(x, y);
      if (target && element.contains(target) && !target.closest('button')) return { x, y };
    }
    throw new Error('The globe must leave a surface available for dragging.');
  });
}

test('opens a rotating tool by click and restores its focus after inspection', async ({ page }) => {
  await openGlobe(page);
  const docker = page.getByRole('button', { name: 'Explore Docker', exact: true });
  await docker.click();
  const details = page.getByRole('region', { name: 'Docker details', exact: true });
  await expect(details).toBeVisible();
  await expect(details).toContainText(/container/i);
  await expect(docker).toHaveAttribute('aria-expanded', 'true');
  await expect(details.getByRole('link')).toHaveAttribute('href', /^https:\/\/docs\.docker\.com\//);
  await details.getByRole('button', { name: 'Close tool details' }).click();
  await expect(details).not.toBeVisible();
  await expect(docker).toHaveAttribute('aria-expanded', 'false');
  await expect(docker).toBeFocused();
});

test('clips rear tools behind the globe and reveals them again as they orbit forward', async ({
  page,
}) => {
  const orbit = await openGlobe(page);
  const anchor = page.locator('[data-tool-id="docker"]');
  const tool = page.getByRole('button', { name: 'Explore Docker', exact: true });
  await orbit.focus();
  const stages = new Set<string>();
  let hidden = false;
  let returned = false;
  for (let step = 0; step < 40; step++) {
    const state = (await anchor.getAttribute('data-occlusion'))!;
    stages.add(state);
    if (state === 'full' && !hidden) {
      hidden = true;
      const bounds = (await tool.boundingBox())!;
      const point = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
      expect(
        await page.evaluate(
          ({ x, y }) => !!document.elementFromPoint(x, y)?.closest('.orbital-tool'),
          point,
        ),
      ).toBe(false);
      await page.mouse.click(point.x, point.y);
      await expect(page.locator('.scene-inspector')).toHaveCount(0);
      await orbit.focus();
    } else if (hidden && state === 'none') {
      returned = true;
      break;
    }
    await orbit.press('ArrowRight');
    await page.clock.runFor(32);
  }
  expect([...stages]).toEqual(expect.arrayContaining(['none', 'partial', 'full']));
  expect(returned).toBe(true);
  await tool.click();
  await expect(page.getByRole('region', { name: 'Docker details', exact: true })).toBeVisible();
});

test('brings an occluded tool forward for keyboard exploration', async ({ page }) => {
  await openGlobe(page);
  const anchor = page.locator('.orbital-tool-anchor[data-occlusion="full"]').first();
  const id = (await anchor.getAttribute('data-tool-id'))!;
  const stableAnchor = page.locator(`[data-tool-id="${id}"]`);
  const tool = stableAnchor.getByRole('button');
  const name = (await tool.getAttribute('aria-label'))!.replace('Explore ', '');
  await tool.focus();
  await page.clock.runFor(32);
  await expect(stableAnchor).toHaveAttribute('data-occlusion', 'none');
  await expect(tool).toBeFocused();
  const bounds = (await tool.boundingBox())!;
  expect(
    await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.getAttribute('aria-label'),
      { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
    ),
  ).toBe(`Explore ${name}`);
  await tool.press('Enter');
  await expect(page.getByRole('region', { name: `${name} details`, exact: true })).toBeVisible();
});

test('makes every orbiting technology and its documentation available by keyboard', async ({
  page,
}) => {
  await openGlobe(page);
  for (const name of technologyNames) {
    const tool = page.getByRole('button', { name: `Explore ${name}`, exact: true });
    await tool.focus();
    await tool.press('Enter');
    const details = page.getByRole('region', { name: `${name} details`, exact: true });
    await expect(details).toBeVisible();
    await expect(tool).toHaveAttribute('aria-expanded', 'true');
    expect((await details.locator('p').allTextContents()).join(' ').trim().length).toBeGreaterThan(
      35,
    );
    await expect(details.getByRole('link')).toHaveAttribute('href', /^https:\/\//);
    await page.keyboard.press('Escape');
    await expect(details).not.toBeVisible();
    await expect(tool).toBeFocused();
  }
});

test('keeps reduced motion still while allowing both keyboard axes and Home reset', async ({
  page,
}) => {
  const orbit = await openGlobe(page);
  const initial = await projection(page);
  await page.clock.runFor(800);
  expect(await projection(page)).toEqual(initial);
  await expect(page.getByRole('button', { name: 'Pause visualization' })).toBeDisabled();
  await orbit.focus();
  await orbit.press('ArrowRight');
  await page.clock.runFor(200);
  const horizontal = await projection(page);
  expect(horizontal).not.toEqual(initial);
  await orbit.press('ArrowUp');
  await page.clock.runFor(200);
  expect(await projection(page)).not.toEqual(horizontal);
  await orbit.press('Home');
  await page.clock.runFor(200);
  expect(await projection(page)).toEqual(initial);
  await expect(page.locator('.scene-inspector')).toHaveCount(0);
});

test('rotates by dragging the globe or a tool without accidentally opening details', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Native touch behavior is covered separately.');
  const orbit = await openGlobe(page);
  const initial = await projection(page);
  const start = await emptyPoint(orbit);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 85, start.y - 45, { steps: 8 });
  await page.mouse.up();
  await page.clock.runFor(200);
  const dragged = await projection(page);
  expect(dragged).not.toEqual(initial);
  await expect(page.locator('.scene-inspector')).toHaveCount(0);

  const docker = page.getByRole('button', { name: 'Explore Docker', exact: true });
  const bounds = await docker.boundingBox();
  expect(bounds).not.toBeNull();
  const x = bounds!.x + bounds!.width / 2;
  const y = bounds!.y + bounds!.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 60, y + 35, { steps: 8 });
  await page.mouse.up();
  await page.clock.runFor(200);
  expect(await projection(page)).not.toEqual(dragged);
  await expect(docker).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.scene-inspector')).toHaveCount(0);
});

test('allows horizontal touch rotation and vertical page scrolling without mobile overflow', async ({
  page,
  context,
  isMobile,
}) => {
  test.skip(!isMobile, 'This checks native mobile gestures.');
  const orbit = await openGlobe(page);
  await expect(orbit).toHaveCSS('touch-action', 'pan-y');
  await orbit.evaluate((element) =>
    element.scrollIntoView({ block: 'center', behavior: 'instant' }),
  );
  await page.clock.runFor(100);
  const touch = await context.newCDPSession(page);
  const start = await emptyPoint(orbit);
  const initial = await projection(page);
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ ...start, id: 1 }],
  });
  for (let step = 1; step <= 6; step++) {
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: start.x + step * 12, y: start.y, id: 1 }],
    });
    await page.clock.runFor(16);
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.clock.runFor(100);
  expect(await projection(page)).not.toEqual(initial);
  await expect(page.locator('.scene-inspector')).toHaveCount(0);

  const scrollStart = await page.evaluate(() => scrollY);
  const verticalStart = await emptyPoint(orbit);
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ ...verticalStart, id: 2 }],
  });
  for (let step = 1; step <= 6; step++) {
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: verticalStart.x, y: verticalStart.y - step * 15, id: 2 }],
    });
    await page.clock.runFor(16);
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scrollStart + 20);
  await touch.detach();

  await page.setViewportSize({ width: 320, height: 800 });
  await orbit.scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Explore Kubernetes', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Kubernetes details' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('preserves pause across manual rotation and reset, then resumes automatic rotation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const orbit = await openGlobe(page);
  await page.getByRole('button', { name: 'Pause visualization' }).click();
  await page.getByRole('button', { name: 'Reset globe orientation' }).click();
  await page.mouse.move(0, 0);
  await page.clock.runFor(300);
  const reset = await projection(page);
  await page.clock.runFor(500);
  expect(await projection(page)).toEqual(reset);

  await orbit.focus();
  await orbit.press('ArrowLeft');
  await page.clock.runFor(300);
  expect(await projection(page)).not.toEqual(reset);
  await page.getByRole('button', { name: 'Reset globe orientation' }).click();
  await page.clock.runFor(300);
  expect(await projection(page)).toEqual(reset);
  await expect(page.getByRole('button', { name: 'Resume visualization' })).toBeEnabled();

  await page.getByRole('button', { name: 'Resume visualization' }).click();
  await page.mouse.move(0, 0);
  await page.clock.runFor(500);
  expect(await projection(page)).not.toEqual(reset);
});

test('holds the rotating tools steady for focus and inspection and resumes on leaving', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openGlobe(page);
  const docker = page.getByRole('button', { name: 'Explore Docker', exact: true });
  await docker.focus();
  await page.clock.runFor(400);
  const focused = await projection(page);
  await page.clock.runFor(500);
  expect(await projection(page)).toEqual(focused);

  await docker.press('Enter');
  const details = page.getByRole('region', { name: 'Docker details', exact: true });
  await details.getByRole('link').focus();
  await page.clock.runFor(300);
  const inspecting = await projection(page);
  await page.clock.runFor(500);
  expect(await projection(page)).toEqual(inspecting);
  await page.keyboard.press('Escape');
  await expect(docker).toBeFocused();

  await page.getByRole('button', { name: 'Infrastructure', exact: true }).focus();
  await page.mouse.move(0, 0);
  await page.clock.runFor(500);
  expect(await projection(page)).not.toEqual(inspecting);
});

test('holds a tool steady under the pointer and resumes after the pointer leaves', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openGlobe(page);
  const bounds = await page
    .getByRole('button', { name: 'Explore Docker', exact: true })
    .boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
  await page.clock.runFor(200);
  const hovered = await projection(page);
  await page.clock.runFor(500);
  expect(await projection(page)).toEqual(hovered);
  await page.mouse.move(0, 0);
  await page.clock.runFor(500);
  expect(await projection(page)).not.toEqual(hovered);
});

test('releases a pending drag when the pointer is lifted just outside the globe', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const orbit = await openGlobe(page);
  const bounds = await orbit.boundingBox();
  expect(bounds).not.toBeNull();
  const x = bounds!.x + bounds!.width - 1;
  const y = bounds!.y + bounds!.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 4, y);
  await page.mouse.up();
  await page.clock.runFor(200);
  const released = await projection(page);
  await page.clock.runFor(500);
  expect(await projection(page)).not.toEqual(released);
  await expect(orbit).not.toHaveAttribute('data-dragging');
});

test('responds to cursor direction and carries drag momentum after release', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const orbit = await openGlobe(page);
  const bounds = await orbit.boundingBox();
  expect(bounds).not.toBeNull();
  const reset = page.getByRole('button', { name: 'Reset globe orientation' });
  const terraform = page.locator('[data-tool-id="terraform"]');
  const horizontalPosition = () =>
    terraform.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);
  await reset.click();
  await page.clock.runFor(16);
  const centered = await horizontalPosition();
  await page.mouse.move(bounds!.x + 10, bounds!.y + bounds!.height / 2);
  await page.clock.runFor(400);
  expect(await horizontalPosition()).toBeLessThan(centered - 1);
  await reset.click();
  await page.clock.runFor(16);
  await page.mouse.move(bounds!.x + bounds!.width - 10, bounds!.y + bounds!.height / 2);
  await page.clock.runFor(400);
  expect(await horizontalPosition()).toBeGreaterThan(centered + 1);

  const positions = () =>
    page.locator('.orbital-tool-anchor').evaluateAll((elements) =>
      elements.map((element) => {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
        return { x: matrix.m41, y: matrix.m42 };
      }),
    );
  const displacement = (
    start: Awaited<ReturnType<typeof positions>>,
    end: Awaited<ReturnType<typeof positions>>,
  ) =>
    start.reduce(
      (sum, node, index) => sum + Math.hypot(node.x - end[index].x, node.y - end[index].y),
      0,
    );
  await reset.click();
  await page.mouse.move(0, 0);
  await page.clock.runFor(100);
  const automaticStart = await positions();
  await page.clock.runFor(128);
  const automaticDistance = displacement(automaticStart, await positions());
  const start = await emptyPoint(orbit);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (let step = 1; step <= 6; step++) {
    await page.mouse.move(start.x + step * 12, start.y);
    await page.clock.runFor(16);
  }
  await page.mouse.up();
  await page.mouse.move(0, 0);
  await page.clock.runFor(16);
  const momentumStart = await positions();
  await page.clock.runFor(128);
  expect(displacement(momentumStart, await positions())).toBeGreaterThan(automaticDistance * 2);
});

test('fits tools and their details at 320px after fonts load in both themes and varied orientations', async ({
  page,
}) => {
  const orbit = await openGlobe(page);
  await page.evaluate(() => document.fonts.ready);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.clock.runFor(300);

  const assertWithinViewport = async () => {
    const dimensions = await page.evaluate(() => ({
      viewport: innerWidth,
      document: document.documentElement.scrollWidth,
      overflowing: Array.from(
        document.querySelectorAll<HTMLElement>('.orbital-tool, .scene-inspector'),
      ).flatMap((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.left < 0 || bounds.right > innerWidth
          ? [{ name: element.getAttribute('aria-label'), left: bounds.left, right: bounds.right }]
          : [];
      }),
    }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.overflowing).toEqual([]);
  };

  for (const theme of ['dark', 'light']) {
    if (theme === 'light') await page.getByRole('button', { name: 'Switch to light mode' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await orbit.scrollIntoViewIfNeeded();
    await orbit.focus();
    await orbit.press('Home');
    await page.clock.runFor(200);
    await assertWithinViewport();
    for (let orientation = 0; orientation < 6; orientation++) {
      for (let step = 0; step < 6; step++) await orbit.press('ArrowRight');
      await orbit.press('ArrowUp');
      await page.clock.runFor(100);
      await assertWithinViewport();
    }
    for (const name of ['Kubernetes', 'Prometheus']) {
      const tool = page.getByRole('button', { name: `Explore ${name}`, exact: true });
      await tool.focus();
      await tool.press('Enter');
      await expect(page.getByRole('region', { name: `${name} details` })).toBeVisible();
      await page.clock.runFor(100);
      await assertWithinViewport();
      await page.keyboard.press('Escape');
    }
  }
});
