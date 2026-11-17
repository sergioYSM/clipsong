import { test, expect, axe } from './fixtures';

test.describe('F07 share previews (S16)', () => {
  test('F07-E2 song link has a preview with title, licence and image', async ({ request }) => {
    const html = await (await request.get('/album/al5?t=t12')).text();
    expect(html).toContain('<meta property="og:title" content="Río de fondo · Hilo Fino"');
    expect(html).toMatch(/og:description" content="Apta para monetizar\. CC BY-SA 4\.0\./);
    expect(html).toMatch(/twitter:card" content="summary_large_image"/);
    const img = await request.get('/og?type=track&id=t12');
    expect(img.status()).toBe(200);
    expect(img.headers()['content-type']).toBe('image/png');
  });

  test('F07-E3 album, artist and non-commercial song previews', async ({ request }) => {
    expect(await (await request.get('/album/al1')).text()).toMatch(/og:description" content="3 canciones, 2 aptas para vídeos monetizados/);
    expect(await (await request.get('/artist/ar2')).text()).toContain('<meta property="og:title" content="Los Faros"');
    expect(await (await request.get('/album/al1?t=t03')).text()).toMatch(/og:description" content="Solo uso no comercial\./);
    expect(await (await request.get('/album/nope')).text()).toContain('<title>No encontrado · Clipsong</title>');
  });

  test('F07-E4 opening a song link focuses that song', async ({ page }) => {
    await page.goto('/album/al5?t=t12');
    await expect(page.getByRole('row', { name: /Río de fondo/ })).toBeFocused();
    await axe(page, 'Album via song link');
  });
});
