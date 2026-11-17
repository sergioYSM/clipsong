import { test, expect } from './fixtures';

test.describe('Installable app (platform)', () => {
  test('P-H1 Chrome reports no installability errors', async ({ page, context }) => {
    await page.goto('/');
    await page.evaluate(() => navigator.serviceWorker.ready);
    const cdp = await context.newCDPSession(page);
    const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
    expect(installabilityErrors).toEqual([]);
    const m = await (await page.request.get('/manifest.webmanifest')).json();
    expect(m).toMatchObject({ short_name: 'Clipsong', display: 'standalone', start_url: '/?source=pwa' });
    for (const icon of m.icons) expect((await page.request.get(icon.src)).status()).toBe(200);
  });

  test.describe(() => {
  // offline: Next's link prefetches fail and log, by design
  test.use({ allowConsole: /ERR_INTERNET_DISCONNECTED|Failed to fetch RSC payload/ });
  test('P-E1 offline navigation shows the offline page, back online it works', async ({ page, context }) => {
    await page.goto('/');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();   // page now controlled by the worker
    await context.setOffline(true);
    await page.evaluate(() => { location.href = '/artist/ar1'; });   // not page.goto: the offline page has no ready marker
    await expect(page.getByRole('heading', { name: 'No hay conexión' })).toBeVisible();
    await context.setOffline(false);
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await page.waitForSelector('html[data-ready=true]');
    await expect(page.getByRole('heading', { level: 1, name: 'Marea Baja' })).toBeVisible();
  });
  });

  test('P-H2 media session: lock-screen metadata and controls are wired', async ({ page }) => {
    await page.goto('/album/al5');
    await page.getByRole('button', { name: 'Reproducir Paisajes' }).first().click();
    await expect.poll(() => page.evaluate(() => navigator.mediaSession.metadata?.title)).toBe('Valle abierto');
    expect(await page.evaluate(() => ({ a: navigator.mediaSession.metadata!.artist, al: navigator.mediaSession.metadata!.album, s: navigator.mediaSession.playbackState })))
      .toEqual({ a: 'Hilo Fino', al: 'Paisajes', s: 'playing' });
  });
});
