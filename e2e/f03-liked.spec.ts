import { test, expect, axe, player, playAlbum } from './fixtures';

test.describe('F03 liked songs', () => {
  test('F03-H1/E1/E3 like from the player, see it, persist, unlike', async ({ page }) => {
    await playAlbum(page);
    await player(page).getByRole('button', { name: 'Guardar en Me gustan' }).click();
    await page.goto('/collection/tracks');
    await expect(page.getByRole('row', { name: /Café a las siete/ })).toBeVisible();
    await axe(page, 'Liked songs');
    await page.reload();
    await expect(page.getByRole('row', { name: /Café a las siete/ })).toBeVisible();
    await page.getByRole('button', { name: 'Quitar Café a las siete de Me gustan' }).click();
    await expect(page.getByText('Las canciones que guardes aparecerán aquí')).toBeVisible();
  });

  test('F03-E2 two tabs: likes from both are kept', async ({ context }) => {
    const a = await context.newPage(); const b = await context.newPage();
    await a.goto('/album/al1'); await b.goto('/album/al2');
    await a.getByRole('row', { name: /Café a las siete/ }).hover();
    await a.getByRole('button', { name: 'Guardar Café a las siete en Me gustan' }).click();
    await b.getByRole('row', { name: /Muelle cuatro/ }).hover();
    await b.getByRole('button', { name: 'Guardar Muelle cuatro en Me gustan' }).click();
    const c = await context.newPage();
    await c.goto('/collection/tracks');
    await expect(c.getByRole('row', { name: /Muelle cuatro/ })).toBeVisible();
    await expect(c.getByRole('row', { name: /Café a las siete/ })).toBeVisible();
  });
});
