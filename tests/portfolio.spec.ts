import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('loads the portfolio and local assets without runtime errors', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const failed: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) failed.push(response.url());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Infrastructure.Made human.');
  await expect(page.getByRole('button', { name: 'Infrastructure', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.locator('#about').scrollIntoViewIfNeeded();
  await expect(page.getByRole('img', { name: 'Fauzan Prima Mukti', exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page
        .getByRole('img', { name: 'Fauzan Prima Mukti', exact: true })
        .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
    )
    .toBe(true);
  for (const file of ['cv', 'project1', 'project2']) {
    const response = await request.get(`/pdf/${file}.pdf`);
    expect(response.ok()).toBe(true);
    expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
  }
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});

test('navigates on desktop and through the mobile menu', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) {
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(page.getByRole('button', { name: 'Close navigation' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  }
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Selected work' })
    .click();
  await expect(page).toHaveURL(/#work$/);
  await expect(page.getByRole('heading', { name: 'Ideas, put into production.' })).toBeInViewport();
  if (isMobile)
    await expect(page.getByRole('button', { name: 'Open navigation' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
});

test('filters projects and opens real project details', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Streaming', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Explore DumbMerch project' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Explore WaysHub project' }).click();
  const dialog = page.getByRole('dialog', { name: 'WaysHub case study' });
  await expect(dialog.getByRole('heading', { name: 'WaysHub' })).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'View source' })).toHaveAttribute(
    'href',
    /automation\/tree\/main\/wayshub$/,
  );
  await expect(dialog.getByRole('link', { name: 'Project documentation' })).toHaveAttribute(
    'href',
    '/pdf/project2.pdf',
  );
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Explore WaysHub project' })).toBeFocused();
  await page.getByRole('button', { name: 'All work' }).click();
  await expect(page.locator('.project-card')).toHaveCount(2);
});

test('opens the résumé, provides download, and restores focus', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'View résumé' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Fauzan Prima Mukti résumé' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('iframe')).toHaveAttribute('src', '/pdf/cv.pdf');
  const downloadPromise = page.waitForEvent('download');
  await dialog.getByRole('link', { name: 'Download PDF' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('Fauzan-Prima-Mukti-CV.pdf');
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  await expect(trigger).toBeFocused();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

test('searches commands, handles empty results, and activates by keyboard', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  const input = page.getByRole('combobox', { name: 'Search commands' });
  await expect(input).toBeFocused();
  await input.fill('nothing matches this');
  await expect(page.getByText('No matching commands.')).toBeVisible();
  await input.press('ArrowDown');
  await input.fill('résumé');
  await input.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Fauzan Prima Mukti résumé' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Open command menu' }).click();
  await input.fill('expertise');
  await input.press('Enter');
  await expect(page).toHaveURL(/#expertise$/);
  await expect(page.locator('#expertise')).toBeFocused();
});

test('changes expertise using the keyboard and updates the panel', async ({ page }) => {
  await page.goto('/');
  const cloud = page.getByRole('tab', { name: 'Cloud & infrastructure' });
  await cloud.click();
  await cloud.press('ArrowDown');
  await expect(page.getByRole('tab', { name: 'Containers & delivery' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByRole('tabpanel')).toContainText('A shorter path to shipped.');
  await page.keyboard.press('End');
  await expect(page.getByRole('tabpanel')).toContainText('See beyond the deploy.');
  await page.keyboard.press('Home');
  await expect(cloud).toBeFocused();
});

test('changes scene layers and honors reduced motion', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Delivery', exact: true }).click();
  await expect(page.getByText('Continuous delivery', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pause visualization' })).toBeDisabled();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Pause visualization' }).click();
  await expect(page.getByRole('button', { name: 'Resume visualization' })).toBeEnabled();
  await page.getByRole('button', { name: 'Resume visualization' }).click();
  await expect(page.getByRole('button', { name: 'Pause visualization' })).toBeEnabled();
});

test('copies the contact email with feedback', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('button', { name: 'Copy email address' }).click();
  await expect(page.locator('.copy-status')).toHaveText('Copied to clipboard');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'fauzanprimamukti@gmail.com',
  );
  await expect(page.getByRole('link', { name: 'Email Fauzan' })).toHaveAttribute(
    'href',
    'mailto:fauzanprimamukti@gmail.com',
  );
});

test('has no horizontal overflow at narrow widths', async ({ page }) => {
  for (const width of [320, 390, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});

test('simulates a release through every delivery gate', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Run simulation', exact: true }).click();
  await page.clock.fastForward(1000);
  await expect(page.locator('.pipeline-status')).toHaveText('Build in progress…');
  await page.getByRole('button', { name: 'Pause simulation' }).click();
  await page.clock.fastForward(5000);
  await expect(page.locator('.pipeline-status')).toHaveText('Paused. Resume to continue.');
  await page.getByRole('button', { name: 'Resume simulation' }).click();
  for (let step = 0; step < 4; step++) await page.clock.runFor(1000);
  await expect(page.locator('.pipeline-status')).toHaveText('Release complete. Every gate passed.');
  await expect(page.locator('.stage-complete')).toHaveCount(5);
});

test('blocks deployment when the simulated verification fails', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('checkbox', { name: 'Simulate a failed check' }).check();
  await page.getByRole('button', { name: 'Run simulation', exact: true }).click();
  for (let step = 0; step < 3; step++) await page.clock.runFor(1000);
  await expect(page.locator('.pipeline-status')).toHaveText(
    'Verification failed. Deployment blocked.',
  );
  await expect(page.getByRole('button', { name: /Deploy WAITING/ })).toContainText('WAITING');
  await page.getByRole('button', { name: 'Reset simulation' }).click();
  await expect(page.locator('.pipeline-status')).toHaveText('Ready when you are.');
  await expect(page.getByRole('checkbox', { name: 'Simulate a failed check' })).toBeEnabled();
});

test('passes automated WCAG AA checks on the page and command dialog', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Infrastructure', exact: true })).toBeVisible();
  const pageResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(pageResults.violations).toEqual([]);
  await page.getByRole('button', { name: 'Open command menu' }).click();
  const dialogResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(dialogResults.violations).toEqual([]);
});
