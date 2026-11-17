import { test, expect, axe, audio, player } from './fixtures';

test.describe('F01 play something from Home', () => {
  test('F01-H1 new user empty state, play an album card', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Aún no has escuchado nada.')).toBeVisible();
    await axe(page, 'Home (new user)');
    const card = page.getByRole('link', { name: /Horas Lentas/ }).first();
    await card.hover();
    await card.getByRole('button', { name: 'Reproducir Horas Lentas' }).click();
    await expect.poll(async () => (await audio(page)).t).toBeGreaterThan(0.2);
    await expect(player(page).getByText('Café a las siete')).toBeVisible();
  });

  test('F01-E1 @mobile mobile width: no horizontal scroll, mini player shows the track', async ({ page }) => {
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
    await page.goto('/album/al5');
    await page.getByRole('button', { name: 'Reproducir Paisajes' }).first().click();
    await expect(player(page).getByText('Valle abierto')).toBeVisible();
    await axe(page, 'Album (mobile)');
  });

  test('F01-E2 keyboard only: Tab to a card play button and press Enter', async ({ page }) => {
    await page.goto('/');
    const btn = page.getByRole('button', { name: 'Reproducir Modo Foco' });
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab');
      if (await page.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Reproducir Modo Foco')) break;
    }
    await expect(page).toHaveURL('/');       // tabbing through the search box must not navigate (BUG-002)
    await expect(btn).toBeFocused();
    await expect(btn).toBeVisible();          // focus must reveal the hover-only button
    await page.keyboard.press('Enter');
    await expect(player(page).getByText('Pantalla en blanco')).toBeVisible();
  });

  test('F01-E3 refresh mid-song restores track and position, paused', async ({ page }) => {
    await page.goto('/album/al3');
    await page.getByRole('button', { name: 'Reproducir Modo Foco' }).first().click();
    await page.waitForTimeout(2500);
    await page.reload();
    await expect(player(page).getByText('Pantalla en blanco')).toBeVisible();
    await expect.poll(async () => (await audio(page)).t).toBeGreaterThan(1);
    expect((await audio(page)).paused).toBe(true);
    await expect(player(page).getByRole('button', { name: 'Reproducir', exact: true })).toBeVisible();
  });

  test.describe(() => {
  test.use({ allowConsole: [/Failed to load resource: net::ERR_FAILED/] });
  test('F01-E4 audio that fails to load: toast and skip, no crash', async ({ page }) => {
    await page.route('**/audio/t01.mp3', (r) => r.abort());
    await page.goto('/album/al1');
    await page.getByRole('button', { name: 'Reproducir Horas Lentas' }).first().click();
    await expect(page.getByRole('status')).toContainText('No se ha podido reproducir');
    await expect(player(page).getByText('Persiana a medias')).toBeVisible();
  });
  });
});
