import { test, expect, axe, audio, player, playAlbum } from './fixtures';

test.describe('F05 queue', () => {
  test('F05-H1/E1 add to queue plays next; remove and clear', async ({ page }) => {
    await playAlbum(page);
    for (const t of ['Valle abierto', 'Arranque']) {
      await page.goto('/search?q=' + encodeURIComponent(t));
      await page.getByRole('row', { name: new RegExp(t) }).first().click({ button: 'right' });
      await page.getByRole('menuitem', { name: 'Añadir a la cola' }).click();
    }
    await page.getByRole('button', { name: 'Cola', exact: true }).click();
    const queue = page.getByRole('complementary', { name: 'Cola' });
    await expect(queue.getByText('A continuación en tu cola')).toBeVisible();
    await axe(page, 'Queue panel');
    await queue.getByRole('listitem').filter({ hasText: 'Arranque' }).hover();
    await queue.getByRole('button', { name: 'Quitar Arranque de la cola' }).click();
    await player(page).getByRole('button', { name: 'Siguiente', exact: true }).click();
    await expect.poll(async () => (await audio(page)).src).toBe('t11.mp3');
    await player(page).getByRole('button', { name: 'Siguiente', exact: true }).click();
    await expect.poll(async () => (await audio(page)).src).toBe('t02.mp3');   // back to the album
  });
});

test.describe('F06 controls', () => {
  test('F06-H1 shuffle only plays songs from the list', async ({ page }) => {
    await page.goto('/album/al1');
    await page.getByRole('button', { name: 'Activar aleatorio', exact: true }).click();
    await page.getByRole('button', { name: 'Reproducir Horas Lentas' }).first().click();
    const seen = new Set<string>();
    for (let i = 0; i < 3; i++) {   // 3 songs: after the last one the list ends and Next is disabled
      seen.add((await audio(page)).src!);
      if (i === 2) break;
      await player(page).getByRole('button', { name: 'Siguiente', exact: true }).click();
      await page.waitForTimeout(150);
    }
    expect([...seen].sort()).toEqual(['t01.mp3', 't02.mp3', 't03.mp3']);
  });

  test('F06-E2 seek with the keyboard', async ({ page }) => {
    await playAlbum(page);
    const slider = player(page).getByRole('slider', { name: 'Posición de la canción' });
    await slider.focus();
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
    await expect.poll(async () => (await audio(page)).t).toBeGreaterThan(9);
  });

  test('F06-E3 previous after 3 s restarts the song', async ({ page }) => {
    await page.goto('/album/al1');
    await page.getByRole('row', { name: /Persiana a medias/ }).dblclick();
    await page.waitForTimeout(3500);
    await player(page).getByRole('button', { name: 'Anterior' }).click();
    await expect.poll(async () => (await audio(page)).t).toBeLessThan(1.5);
    expect((await audio(page)).src).toBe('t02.mp3');
  });
});

test.describe('F07 share and credit', () => {
  test('F07-H1/E1/H2 copy link opens the album; copy credit has the licence', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/album/al5');
    await page.getByRole('row', { name: /Río de fondo/ }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Copiar enlace' }).click();
    await expect(page.getByRole('status')).toContainText('Enlace copiado');
    const link = await page.evaluate(() => navigator.clipboard.readText());
    await page.goto(link);
    await expect(page.getByRole('heading', { level: 1, name: 'Paisajes' })).toBeVisible();
    await page.getByRole('row', { name: /Río de fondo/ }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Copiar crédito' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Música: "Río de fondo" de Hilo Fino, con licencia CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/). Encontrada en Clipsong.');
  });
});

test.describe('F08 follow', () => {
  test('F08-H1 follow an artist, it shows in the library', async ({ page }) => {
    await page.goto('/artist/ar3');
    await axe(page, 'Artist');
    await page.getByRole('button', { name: 'Seguir' }).click();
    const lib = page.getByRole('navigation', { name: 'Tu biblioteca' });
    await lib.getByRole('button', { name: 'Artistas' }).click();
    await expect(lib.getByRole('link', { name: /Nube Ocho/ })).toBeVisible();
  });
});

test.describe('Licence filter', () => {
  test('L-H1/E1 filter hides non-monetizable songs everywhere, remembered, explains empty lists', async ({ page }) => {
    await page.goto('/album/al1');
    await page.getByRole('button', { name: 'Apta para monetizar' }).first().click();
    await expect(page.getByRole('row', { name: /Domingo sin prisa/ })).toHaveCount(0);
    await page.goto('/album/al4');
    await expect(page.getByRole('row', { name: /Esquina con eco/ })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Apta para monetizar' }).first()).toHaveAttribute('aria-pressed', 'true');
    await page.goto('/search?q=domingo');
    await expect(page.getByText(/Ninguna canción de aquí es apta/)).toBeVisible();
  });

  test.describe(() => {
  test.use({ allowConsole: [/status of 404/] });
  test('settings and login screens pass axe', async ({ page }) => {
    await page.goto('/settings'); await axe(page, 'Settings');
    await page.goto('/login'); await axe(page, 'Login');
    await page.goto('/account'); await axe(page, 'Account');
    await page.goto('/radio/t06'); await axe(page, 'Radio');
    await page.goto('/genre/piano'); await axe(page, 'Genre');
    await page.goto('/nope'); await axe(page, 'Not found');
  });
  });
});
