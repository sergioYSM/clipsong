# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: f04-playlists.spec.ts >> F04 playlists >> F04-E9 reorder with the keyboard
- Location: e2e/f04-playlists.spec.ts:95:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('row').nth(1)
Expected substring: "Río de fondo"
Received string:    "1PValle abiertoHilo FinoPaisajeshoyApta para monetizarApta para monetizar0:50"
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByRole('row').nth(1) with timeout 5000ms
  - waiting for getByRole('row').nth(1)
    14 × locator resolved to <div role="row" tabindex="0" draggable="true" class="group grid grid-cols-[24px_minmax(0,1fr)_auto_40px] md:grid-cols-[24px_minmax(0,4fr)_minmax(0,3fr)_auto_40px] lg:grid-cols-[24px_minmax(0,4fr)_minmax(0,3fr)_minmax(0,2fr)_auto_40px] items-center gap-4 rounded-sm px-4 py-2 hover:bg-surface-hover focus-visible:bg-surface-hover ">…</div>
       - unexpected value "1PValle abiertoHilo FinoPaisajeshoyApta para monetizarApta para monetizar0:50"

```

```yaml
- row "1 Valle abierto Hilo Fino Paisajes hoy Apta para monetizar Guardar Valle abierto en Me gustan 0:50 Más opciones para Valle abierto":
  - cell "1"
  - cell "Valle abierto Hilo Fino":
    - text: Valle abierto
    - link "Hilo Fino":
      - /url: /artist/ar5
  - cell "Paisajes"
  - cell "hoy"
  - cell "Apta para monetizar Guardar Valle abierto en Me gustan":
    - text: Apta para monetizar
    - button "Guardar Valle abierto en Me gustan"
  - cell "0:50 Más opciones para Valle abierto":
    - text: 0:50
    - button "Más opciones para Valle abierto"
```

# Test source

```ts
  1   | import { test, expect, axe } from './fixtures';
  2   | import type { Page } from '@playwright/test';
  3   | 
  4   | async function newPlaylist(page: Page) {
  5   |   await page.goto('/');
  6   |   await page.getByRole('navigation', { name: 'Tu biblioteca' }).getByRole('button', { name: 'Crear lista' }).first().click();
  7   |   await expect(page).toHaveURL(/\/playlist\//);
  8   |   return page.url();
  9   | }
  10  | async function rename(page: Page, name: string) {
  11  |   await page.getByRole('button', { name: 'Editar detalles' }).click();
  12  |   await page.getByLabel('Nombre').fill(name);
  13  | }
  14  | 
  15  | test.describe('F04 playlists', () => {
  16  |   test('F04-H1 create, add two ways, rename', async ({ page }) => {
  17  |     await newPlaylist(page);
  18  |     await expect(page.getByText('Esta lista está vacía')).toBeVisible();
  19  |     await axe(page, 'Playlist (empty)');
  20  |     await page.getByLabel('Buscar canciones para añadir').fill('valle');
  21  |     await page.getByRole('button', { name: 'Añadir' }).first().click();
  22  |     await page.goto('/album/al1');
  23  |     await page.getByRole('row', { name: /Café a las siete/ }).click({ button: 'right' });
  24  |     await page.getByRole('menuitem', { name: 'Añadir a una lista' }).click();
  25  |     await page.getByRole('menuitem', { name: /Mi lista n.º 1/ }).click();
  26  |     await page.getByRole('navigation', { name: 'Tu biblioteca' }).getByRole('link', { name: /Mi lista n.º 1/ }).click();
  27  |     await expect(page.getByRole('row')).toHaveCount(3);   // header + 2
  28  |     await rename(page, 'Intro del vlog');
  29  |     await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  30  |     await expect(page.getByRole('heading', { level: 1, name: 'Intro del vlog' })).toBeVisible();
  31  |     await axe(page, 'Playlist (filled)');
  32  |   });
  33  | 
  34  |   test('F04-E1 empty name rejected', async ({ page }) => {
  35  |     await newPlaylist(page);
  36  |     await rename(page, '   ');
  37  |     await expect(page.getByRole('dialog').getByRole('alert')).toContainText('La lista necesita un nombre');
  38  |     await expect(page.getByRole('dialog').getByRole('button', { name: 'Guardar' })).toBeDisabled();
  39  |     await axe(page, 'Edit playlist dialog');
  40  |   });
  41  | 
  42  |   test('F04-E2 name over 100 characters rejected', async ({ page }) => {
  43  |     await newPlaylist(page);
  44  |     await rename(page, 'x'.repeat(101));
  45  |     await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Máximo 100');
  46  |   });
  47  | 
  48  |   test('F04-E3 emoji and accents kept', async ({ page }) => {
  49  |     await newPlaylist(page);
  50  |     await rename(page, 'Música 🎬 para vídeos ñ');
  51  |     await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  52  |     await page.reload();
  53  |     await expect(page.getByRole('heading', { level: 1, name: 'Música 🎬 para vídeos ñ' })).toBeVisible();
  54  |   });
  55  | 
  56  |   test('F04-E4 duplicate is not added twice', async ({ page }) => {
  57  |     await newPlaylist(page);
  58  |     await page.getByLabel('Buscar canciones para añadir').fill('valle');
  59  |     await page.getByRole('button', { name: 'Añadir' }).first().click();
  60  |     await page.getByRole('button', { name: 'Añadir' }).first().click();
  61  |     await expect(page.getByRole('status')).toContainText('Ya estaba');
  62  |     await expect(page.getByRole('row', { name: /Valle abierto/ })).toHaveCount(1);
  63  |   });
  64  | 
  65  |   test('F04-E5/E6 delete, undo restores; deleted URL shows not found', async ({ page }) => {
  66  |     const url = await newPlaylist(page);
  67  |     await page.getByLabel('Buscar canciones para añadir').fill('valle');
  68  |     await page.getByRole('button', { name: 'Añadir' }).first().click();
  69  |     await page.getByRole('button', { name: /Más opciones para Mi lista/ }).click();
  70  |     await page.getByRole('menuitem', { name: 'Borrar lista' }).click();
  71  |     await expect(page).toHaveURL('/');
  72  |     await page.getByRole('status').getByRole('button', { name: 'Deshacer' }).click();
  73  |     await expect(page.getByRole('row', { name: /Valle abierto/ })).toBeVisible();
  74  |     await page.getByRole('button', { name: /Más opciones para Mi lista/ }).click();
  75  |     await page.getByRole('menuitem', { name: 'Borrar lista' }).click();
  76  |     await page.goto(url);
  77  |     await expect(page.getByRole('heading', { name: 'No encontramos esta lista' })).toBeVisible();
  78  |   });
  79  | 
  80  |   test('F04-E7 double click on create makes one playlist per click (documented)', async ({ page }) => {
  81  |     await page.goto('/');
  82  |     await page.getByRole('navigation', { name: 'Tu biblioteca' }).getByRole('button', { name: 'Crear lista' }).first().dblclick();
  83  |     await expect(page.getByRole('navigation', { name: 'Tu biblioteca' }).getByRole('link', { name: /Mi lista n.º/ })).toHaveCount(2);
  84  |   });
  85  | 
  86  |   test('F04-E8 remove a song', async ({ page }) => {
  87  |     await newPlaylist(page);
  88  |     await page.getByLabel('Buscar canciones para añadir').fill('valle');
  89  |     await page.getByRole('button', { name: 'Añadir' }).first().click();
  90  |     await page.getByRole('row', { name: /Valle abierto/ }).click({ button: 'right' });
  91  |     await page.getByRole('menuitem', { name: 'Quitar de esta lista' }).click();
  92  |     await expect(page.getByText('Esta lista está vacía')).toBeVisible();
  93  |   });
  94  | 
  95  |   test('F04-E9 reorder with the keyboard', async ({ page }) => {
  96  |     test.fail(true, 'known gap: reorder is mouse-only (BUG-004)');
  97  |     await newPlaylist(page);
  98  |     for (const q of ['valle', 'río']) { await page.getByLabel('Buscar canciones para añadir').fill(q); await page.getByRole('button', { name: 'Añadir' }).first().click(); }
  99  |     await page.getByRole('row', { name: /Río de fondo/ }).focus();
  100 |     await page.keyboard.press('Alt+ArrowUp');
> 101 |     await expect(page.getByRole('row').nth(1)).toContainText('Río de fondo');
      |                                                ^ Error: expect(locator).toContainText(expected) failed
  102 |   });
  103 | });
  104 | 
```