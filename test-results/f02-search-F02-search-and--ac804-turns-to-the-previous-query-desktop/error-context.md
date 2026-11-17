# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: f02-search.spec.ts >> F02 search and play >> F02-E7 back button returns to the previous query
- Location: e2e/f02-search.spec.ts:56:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /artist\/ar5/
Received string:  "http://localhost:3000/search?q=valle"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × locator resolved to <html lang="es" data-ready="true">…</html>
       - unexpected value "http://localhost:3000/search?q=valle"

```

```yaml
- link "Saltar al contenido":
  - /url: "#main"
- navigation "Tu biblioteca":
  - button "Contraer biblioteca": Tu biblioteca
  - button "Crear lista"
  - group "Filtrar biblioteca":
    - button "Listas"
    - button "Álbumes"
    - button "Artistas"
  - button "Buscar en tu biblioteca"
  - button "Recientes"
  - list:
    - listitem:
      - link "Me gustan Fijada Lista · 0 canciones":
        - /url: /collection/tracks
        - text: Me gustan
        - img "Fijada"
        - text: Lista · 0 canciones
    - listitem:
      - paragraph: Crea tu primera lista
      - paragraph: Junta las canciones para tu próximo vídeo.
      - button "Crear lista"
- banner:
  - button "Atrás"
  - button "Adelante"
  - link "Inicio":
    - /url: /
  - search:
    - searchbox "Buscar canciones, artistas o álbumes": valle
    - button "Borrar búsqueda"
  - link "Entrar":
    - /url: /login
- main:
  - button "Apta para monetizar"
  - heading "Resultados para «valle»" [level=1]
  - region "Mejor resultado":
    - heading "Mejor resultado" [level=2]
    - link "Valle abierto Canción · Hilo Fino Reproducir Valle abierto":
      - /url: /album/al5
      - text: Valle abierto Canción · Hilo Fino
      - button "Reproducir Valle abierto"
  - region "Canciones":
    - heading "Canciones" [level=2]
    - table "Canciones de «valle»":
      - row "# Título Licencia Duración":
        - columnheader "#"
        - columnheader "Título"
        - columnheader "Licencia"
        - columnheader "Duración":
          - img "Duración"
      - rowgroup:
        - row "Reproducir Valle abierto Valle abierto Hilo Fino Apta para monetizar Guardar Valle abierto en Me gustan 0:50 Más opciones para Valle abierto":
          - cell "Reproducir Valle abierto":
            - button "Reproducir Valle abierto"
          - cell "Valle abierto Hilo Fino":
            - text: Valle abierto
            - link "Hilo Fino":
              - /url: /artist/ar5
          - cell "Apta para monetizar Guardar Valle abierto en Me gustan":
            - text: Apta para monetizar
            - button "Guardar Valle abierto en Me gustan"
          - cell "0:50 Más opciones para Valle abierto":
            - text: 0:50
            - button "Más opciones para Valle abierto"
        - row "2 Semáforo en ámbar Calle Norte Apta para monetizar Guardar Semáforo en ámbar en Me gustan 0:35 Más opciones para Semáforo en ámbar":
          - cell "2"
          - cell "Semáforo en ámbar Calle Norte":
            - text: Semáforo en ámbar
            - link "Calle Norte":
              - /url: /artist/ar4
          - cell "Apta para monetizar Guardar Semáforo en ámbar en Me gustan":
            - text: Apta para monetizar
            - button "Guardar Semáforo en ámbar en Me gustan"
          - cell "0:35 Más opciones para Semáforo en ámbar":
            - text: 0:35
            - button "Más opciones para Semáforo en ámbar"
        - row "3 Esquina con eco Calle Norte Solo uso no comercial Guardar Esquina con eco en Me gustan 0:39 Más opciones para Esquina con eco":
          - cell "3"
          - cell "Esquina con eco Calle Norte":
            - text: Esquina con eco
            - link "Calle Norte":
              - /url: /artist/ar4
          - cell "Solo uso no comercial Guardar Esquina con eco en Me gustan":
            - text: Solo uso no comercial
            - button "Guardar Esquina con eco en Me gustan"
          - cell "0:39 Más opciones para Esquina con eco":
            - text: 0:39
            - button "Más opciones para Esquina con eco"
  - region "Artistas":
    - heading "Artistas" [level=2]
    - link "Calle Norte Artista":
      - /url: /artist/ar4
- complementary "Sonando ahora":
  - heading "Sonando ahora" [level=2]
  - button "Cerrar panel"
  - paragraph: Cuando reproduzcas algo, aquí verás su licencia y el crédito listo para copiar.
- region "Reproductor":
  - text: Elige algo para escuchar
  - button "Activar aleatorio (solo mezcla esta lista)"
  - button "Anterior" [disabled]
  - button "Reproducir" [disabled]
  - button "Siguiente" [disabled]
  - 'button "Repetir: desactivado"'
  - text: 0:00
  - slider "Posición de la canción" [disabled]
  - text: 0:00
  - button "Copiar crédito de la canción" [disabled]
  - button "Panel de lo que suena" [pressed]
  - button "Cola"
  - button "Silenciar"
  - slider "Volumen"
- status
- alert
```

# Test source

```ts
  1  | import { test, expect, axe, audio, player } from './fixtures';
  2  | 
  3  | const search = (page: import('@playwright/test').Page) => page.locator('#global-search');
  4  | 
  5  | test.describe('F02 search and play', () => {
  6  |   test('F02-H1 type, see results, play a song', async ({ page }) => {
  7  |     await page.goto('/search');
  8  |     await search(page).fill('valle');
  9  |     await expect(page.getByRole('heading', { name: 'Mejor resultado' })).toBeVisible();
  10 |     await axe(page, 'Search results');
  11 |     await page.getByRole('row', { name: /Valle abierto/ }).hover();
  12 |     await page.getByRole('row', { name: /Valle abierto/ }).getByRole('button', { name: 'Reproducir Valle abierto' }).click();
  13 |     await expect(player(page).getByText('Valle abierto')).toBeVisible();
  14 |     await expect.poll(async () => (await audio(page)).src).toBe('t11.mp3');
  15 |   });
  16 | 
  17 |   test('F02-E1 empty query shows browse tiles', async ({ page }) => {
  18 |     await page.goto('/search');
  19 |     await expect(page.getByRole('heading', { name: 'Explorar por género y ánimo' })).toBeVisible();
  20 |     await axe(page, 'Search browse');
  21 |   });
  22 | 
  23 |   test('F02-E2 accents and case', async ({ page }) => {
  24 |     await page.goto('/search?q=CAFE');
  25 |     await expect(page.getByRole('row', { name: /Café a las siete/ })).toBeVisible();
  26 |   });
  27 | 
  28 |   test('F02-E3 one typo tolerated', async ({ page }) => {
  29 |     await page.goto('/search?q=marea%20vaja');
  30 |     await expect(page.getByRole('link', { name: /Marea Baja/ }).first()).toBeVisible();
  31 |   });
  32 | 
  33 |   test('F02-E4 emoji only: no-results state', async ({ page }) => {
  34 |     await page.goto('/search');
  35 |     await search(page).fill('🎵🎵');
  36 |     await expect(page.getByRole('heading', { name: 'Nada con «🎵🎵»' })).toBeVisible();
  37 |   });
  38 | 
  39 |   test('F02-E5 very long query does not break layout', async ({ page }) => {
  40 |     await page.goto('/search');
  41 |     await search(page).fill('a'.repeat(500));
  42 |     await expect(page.getByRole('heading', { name: /Nada con/ })).toBeVisible();
  43 |     expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
  44 |     const h = page.getByRole('heading', { name: /Nada con/ });
  45 |     const box = await h.boundingBox();
  46 |     expect(box!.width).toBeLessThanOrEqual(1440);
  47 |   });
  48 | 
  49 |   test('F02-E6 "/" focuses search from anywhere', async ({ page }) => {
  50 |     await page.goto('/album/al1');
  51 |     await page.locator('main').click({ position: { x: 5, y: 5 } });
  52 |     await page.keyboard.press('/');
  53 |     await expect(search(page)).toBeFocused();
  54 |   });
  55 | 
  56 |   test('F02-E7 back button returns to the previous query', async ({ page }) => {
  57 |     await page.goto('/search?q=valle');
  58 |     await expect(page.getByRole('row', { name: /Valle abierto/ })).toBeVisible();
  59 |     await page.getByRole('row', { name: /Valle abierto/ }).getByRole('link', { name: 'Hilo Fino' }).click();
> 60 |     await expect(page).toHaveURL(/artist\/ar5/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  61 |     await page.goBack();
  62 |     await expect(page).toHaveURL(/q=valle/);
  63 |     await expect(search(page)).toHaveValue('valle');
  64 |     await expect(page.getByRole('row', { name: /Valle abierto/ })).toBeVisible();
  65 |   });
  66 | });
  67 | 
```