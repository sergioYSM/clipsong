import { test, expect, axe, audio, player } from './fixtures';

const search = (page: import('@playwright/test').Page) => page.locator('#global-search');

test.describe('F02 search and play', () => {
  test('F02-H1 type, see results, play a song', async ({ page }) => {
    await page.goto('/search');
    await search(page).fill('valle');
    await expect(page.getByRole('heading', { name: 'Mejor resultado' })).toBeVisible();
    await axe(page, 'Search results');
    await page.getByRole('row', { name: /Valle abierto/ }).hover();
    await page.getByRole('row', { name: /Valle abierto/ }).getByRole('button', { name: 'Reproducir Valle abierto' }).click();
    await expect(player(page).getByText('Valle abierto')).toBeVisible();
    await expect.poll(async () => (await audio(page)).src).toBe('t11.mp3');
  });

  test('F02-E1 empty query shows browse tiles', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByRole('heading', { name: 'Explorar por género y ánimo' })).toBeVisible();
    await axe(page, 'Search browse');
  });

  test('F02-E2 accents and case', async ({ page }) => {
    await page.goto('/search?q=CAFE');
    await expect(page.getByRole('row', { name: /Café a las siete/ })).toBeVisible();
  });

  test('F02-E3 one typo tolerated', async ({ page }) => {
    await page.goto('/search?q=marea%20vaja');
    await expect(page.getByRole('link', { name: /Marea Baja/ }).first()).toBeVisible();
  });

  test('F02-E4 emoji only: no-results state', async ({ page }) => {
    await page.goto('/search');
    await search(page).fill('🎵🎵');
    await expect(page.getByRole('heading', { name: 'Nada con «🎵🎵»' })).toBeVisible();
  });

  test('F02-E5 very long query does not break layout', async ({ page }) => {
    await page.goto('/search');
    await search(page).fill('a'.repeat(500));
    await expect(page.getByRole('heading', { name: /Nada con/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
    const h = page.getByRole('heading', { name: /Nada con/ });
    const box = await h.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(1440);
  });

  test('F02-E6 "/" focuses search from anywhere', async ({ page }) => {
    await page.goto('/album/al1');
    await page.locator('main').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('/');
    await expect(search(page)).toBeFocused();
  });

  test('F02-E7 back button returns to the previous query', async ({ page }) => {
    await page.goto('/search?q=valle');
    await expect(page.getByRole('row', { name: /Valle abierto/ })).toBeVisible();
    await page.getByRole('row', { name: /Valle abierto/ }).getByRole('link', { name: 'Hilo Fino' }).click();
    await expect(page).toHaveURL(/artist\/ar5/);
    await page.goBack();
    await expect(page).toHaveURL(/q=valle/);
    await expect(search(page)).toHaveValue('valle');
    await expect(page.getByRole('row', { name: /Valle abierto/ })).toBeVisible();
  });

  test('F02-E8 clicking a result right after load is not undone by the search box (BUG-006)', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.goto('/search?q=valle');
      await page.waitForTimeout(150);   // inside the old 250 ms window
      await page.getByRole('link', { name: 'Hilo Fino', exact: true }).first().click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/artist\/ar5/);
    }
  });
});

test('F02-H2 search finds your playlists by name, accents and typos included', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Tu biblioteca' }).getByRole('button', { name: 'Crear lista' }).first().click();
  await page.getByRole('button', { name: 'Editar detalles' }).click();
  await page.getByLabel('Nombre').fill('Vídeos de cocina');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await page.getByLabel('Buscar canciones para añadir').fill('valle');
  await page.getByRole('button', { name: 'Añadir' }).first().click();
  for (const q of ['cocina', 'videos', 'cosina']) {
    await page.goto('/search?q=' + q);
    await expect(page.getByRole('region', { name: 'Listas' }).getByRole('link', { name: /Vídeos de cocina/ })).toBeVisible();
  }
  await expect(page.getByRole('region', { name: 'Mejor resultado' }).getByText('Vídeos de cocina')).toBeVisible();
  await page.getByRole('region', { name: 'Mejor resultado' }).getByRole('link').hover();
  await page.getByRole('region', { name: 'Mejor resultado' }).getByRole('button', { name: 'Reproducir Vídeos de cocina' }).click();
  await expect(page.getByRole('region', { name: 'Reproductor' }).getByText('Valle abierto')).toBeVisible();
  await axe(page, 'Search with playlists');
});
