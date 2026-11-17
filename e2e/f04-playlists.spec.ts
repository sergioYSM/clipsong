import { test, expect, axe } from './fixtures';
import type { Page } from '@playwright/test';

async function newPlaylist(page: Page) {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Tu biblioteca' }).getByRole('button', { name: 'Crear lista' }).first().click();
  await expect(page).toHaveURL(/\/playlist\//);
  return page.url();
}
async function rename(page: Page, name: string) {
  await page.getByRole('button', { name: 'Editar detalles' }).click();
  await page.getByLabel('Nombre').fill(name);
}

test.describe('F04 playlists', () => {
  test('F04-H1 create, add two ways, rename', async ({ page }) => {
    await newPlaylist(page);
    await expect(page.getByText('Esta lista está vacía')).toBeVisible();
    await axe(page, 'Playlist (empty)');
    await page.getByLabel('Buscar canciones para añadir').fill('valle');
    await page.getByRole('button', { name: 'Añadir' }).first().click();
    await page.goto('/album/al1');
    await page.getByRole('row', { name: /Café a las siete/ }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Añadir a una lista' }).click();
    await page.getByRole('menuitem', { name: /Mi lista n.º 1/ }).click();
    await page.getByRole('navigation', { name: 'Tu biblioteca' }).getByRole('link', { name: /Mi lista n.º 1/ }).click();
    await expect(page.getByRole('row')).toHaveCount(3);   // header + 2
    await rename(page, 'Intro del vlog');
    await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Intro del vlog' })).toBeVisible();
    await axe(page, 'Playlist (filled)');
  });

  test('F04-E1 empty name rejected', async ({ page }) => {
    await newPlaylist(page);
    await rename(page, '   ');
    await expect(page.getByRole('dialog').getByRole('alert')).toContainText('La lista necesita un nombre');
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Guardar' })).toBeDisabled();
    await axe(page, 'Edit playlist dialog');
  });

  test('F04-E2 name over 100 characters rejected', async ({ page }) => {
    await newPlaylist(page);
    await rename(page, 'x'.repeat(101));
    await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Máximo 100');
  });

  test('F04-E3 emoji and accents kept', async ({ page }) => {
    await newPlaylist(page);
    await rename(page, 'Música 🎬 para vídeos ñ');
    await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Música 🎬 para vídeos ñ' })).toBeVisible();
  });

  test('F04-E4 duplicate is not added twice', async ({ page }) => {
    await newPlaylist(page);
    await page.getByLabel('Buscar canciones para añadir').fill('valle');
    await page.getByRole('button', { name: 'Añadir' }).first().click();
    await page.getByRole('button', { name: 'Añadir' }).first().click();
    await expect(page.getByRole('status')).toContainText('Ya estaba');
    await expect(page.getByRole('row', { name: /Valle abierto/ })).toHaveCount(1);
  });

  test('F04-E5/E6 delete, undo restores; deleted URL shows not found', async ({ page }) => {
    const url = await newPlaylist(page);
    await page.getByLabel('Buscar canciones para añadir').fill('valle');
    await page.getByRole('button', { name: 'Añadir' }).first().click();
    await page.getByRole('button', { name: /Más opciones para Mi lista/ }).click();
    await page.getByRole('menuitem', { name: 'Borrar lista' }).click();
    await expect(page).toHaveURL('/');
    await page.getByRole('status').getByRole('button', { name: 'Deshacer' }).click();
    await expect(page.getByRole('row', { name: /Valle abierto/ })).toBeVisible();
    await page.getByRole('button', { name: /Más opciones para Mi lista/ }).click();
    await page.getByRole('menuitem', { name: 'Borrar lista' }).click();
    await page.goto(url);
    await expect(page.getByRole('heading', { name: 'No encontramos esta lista' })).toBeVisible();
  });

  test('F04-E7 double click on create makes one playlist per click (documented)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Tu biblioteca' }).getByRole('button', { name: 'Crear lista' }).first().dblclick();
    await expect(page.getByRole('navigation', { name: 'Tu biblioteca' }).getByRole('link', { name: /Mi lista n.º/ })).toHaveCount(2);
  });

  test('F04-E8 remove a song', async ({ page }) => {
    await newPlaylist(page);
    await page.getByLabel('Buscar canciones para añadir').fill('valle');
    await page.getByRole('button', { name: 'Añadir' }).first().click();
    await page.getByRole('row', { name: /Valle abierto/ }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Quitar de esta lista' }).click();
    await expect(page.getByText('Esta lista está vacía')).toBeVisible();
  });

  test('F04-E9 reorder with the keyboard (BUG-004)', async ({ page }) => {
    await newPlaylist(page);
    for (const q of ['valle', 'río', 'arranque']) { await page.getByLabel('Buscar canciones para añadir').fill(q); await page.getByRole('button', { name: 'Añadir' }).first().click(); }
    const rows = page.getByRole('table').getByRole('row');
    await page.getByRole('row', { name: /Arranque/ }).focus();
    await page.keyboard.press('Alt+ArrowUp');
    await page.keyboard.press('Alt+ArrowUp');
    await expect(rows.nth(1)).toContainText('Arranque');
    await expect(page.getByRole('row', { name: /Arranque/ })).toBeFocused();   // focus follows the row
    await page.keyboard.press('ArrowDown');                                     // arrows move focus between rows
    await expect(page.getByRole('row', { name: /Valle abierto/ })).toBeFocused();
    await page.keyboard.press('Shift+F10');
    await page.getByRole('menuitem', { name: /Mover abajo/ }).click();
    await expect(rows.nth(3)).toContainText('Valle abierto');
    await page.reload();
    await expect(rows.nth(1)).toContainText('Arranque');                        // order persisted
    await axe(page, 'Playlist (reordered)');
  });
});

test('BUG-007 every screen has a title naming it', async ({ page }) => {
  for (const [path, title] of [['/album/al1', 'Horas Lentas · Marea Baja · Clipsong'], ['/artist/ar2', 'Los Faros · Clipsong'], ['/collection/tracks', 'Me gustan · Clipsong'], ['/search?q=valle', 'Buscar «valle» · Clipsong']] as const) {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
  }
  await page.getByRole('link', { name: 'Inicio' }).click();
  await expect(page).toHaveTitle('Inicio · Clipsong');
});
