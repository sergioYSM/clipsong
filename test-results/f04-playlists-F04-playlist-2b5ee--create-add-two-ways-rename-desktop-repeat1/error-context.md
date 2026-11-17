# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: f04-playlists.spec.ts >> F04 playlists >> F04-H1 create, add two ways, rename
- Location: e2e/f04-playlists.spec.ts:16:7

# Error details

```
Error: axe on Playlist (empty)

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "document-title (serious) x1: Documents must have <title> element to aid in navigation :: html",
+ ]
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - link "Saltar al contenido" [ref=e3] [cursor=pointer]:
      - /url: "#main"
    - generic [ref=e4]:
      - navigation "Tu biblioteca" [ref=e6]:
        - generic [ref=e7]:
          - button "Contraer biblioteca" [ref=e8] [cursor=pointer]: Tu biblioteca
          - button "Crear lista" [active] [ref=e11] [cursor=pointer]
        - group "Filtrar biblioteca" [ref=e13]:
          - button "Listas" [ref=e14] [cursor=pointer]
          - button "Álbumes" [ref=e15] [cursor=pointer]
          - button "Artistas" [ref=e16] [cursor=pointer]
        - generic [ref=e17]:
          - button "Buscar en tu biblioteca" [ref=e18] [cursor=pointer]
          - button "Recientes" [ref=e22] [cursor=pointer]
        - list [ref=e26]:
          - listitem [ref=e27]:
            - link "Me gustan Fijada Lista · 0 canciones" [ref=e28] [cursor=pointer]:
              - /url: /collection/tracks
              - generic [ref=e32]:
                - generic [ref=e33]: Me gustan
                - generic [ref=e34]:
                  - img "Fijada" [ref=e35]
                  - text: Lista · 0 canciones
          - listitem [ref=e37]:
            - link "Mi lista n.º 1 Lista · Tú" [ref=e38] [cursor=pointer]:
              - /url: /playlist/b5f04d9a-4b1c-4f39-8dca-3fd3d73bfdfe
              - generic [ref=e40]: M
              - generic [ref=e41]:
                - generic [ref=e42]: Mi lista n.º 1
                - generic [ref=e43]: Lista · Tú
      - generic [ref=e44]:
        - banner [ref=e45]:
          - generic [ref=e46]:
            - button "Atrás" [ref=e47] [cursor=pointer]
            - button "Adelante" [ref=e50] [cursor=pointer]
          - generic [ref=e53]:
            - link "Inicio" [ref=e54] [cursor=pointer]:
              - /url: /
            - search [ref=e58]:
              - searchbox "Buscar canciones, artistas o álbumes" [ref=e62]
          - link "Entrar" [ref=e63] [cursor=pointer]:
            - /url: /login
        - main [ref=e64]:
          - generic [ref=e65]:
            - generic [ref=e66]:
              - generic [ref=e67]:
                - button "Editar detalles" [ref=e69] [cursor=pointer]:
                  - generic [ref=e71]: M
                - generic [ref=e72]:
                  - paragraph [ref=e73]: Lista privada
                  - heading "Mi lista n.º 1" [level=1] [ref=e74]
                  - generic [ref=e75]: Tú · 0 canciones
              - generic [ref=e76]:
                - button "Reproducir Mi lista n.º 1"
                - button "Activar aleatorio" [ref=e77] [cursor=pointer]
                - button "Más opciones para Mi lista n.º 1" [ref=e84] [cursor=pointer]
                - button "Apta para monetizar" [ref=e90] [cursor=pointer]
            - paragraph [ref=e94]: Esta lista está vacía. Busca canciones abajo para añadir.
            - region "Añadir canciones" [ref=e95]:
              - heading "Busca canciones para tu lista" [level=2] [ref=e96]
              - textbox "Buscar canciones para añadir" [ref=e101]:
                - /placeholder: Canción, artista o género
              - list
      - complementary "Sonando ahora" [ref=e102]:
        - generic [ref=e103]:
          - heading "Sonando ahora" [level=2] [ref=e104]
          - button "Cerrar panel" [ref=e105] [cursor=pointer]
        - paragraph [ref=e109]: Cuando reproduzcas algo, aquí verás su licencia y el crédito listo para copiar.
    - region "Reproductor" [ref=e110]:
      - generic [ref=e111]: Elige algo para escuchar
      - generic [ref=e113]:
        - generic [ref=e114]:
          - button "Activar aleatorio (solo mezcla esta lista)" [ref=e116] [cursor=pointer]
          - button "Anterior" [disabled] [ref=e123]
          - button "Reproducir" [disabled] [ref=e126]
          - button "Siguiente" [disabled] [ref=e129]
          - 'button "Repetir: desactivado" [ref=e133] [cursor=pointer]'
        - generic [ref=e139]:
          - generic [ref=e140]: 0:00
          - slider "Posición de la canción" [disabled]
          - generic [ref=e141]: 0:00
      - generic [ref=e142]:
        - button "Copiar crédito de la canción" [disabled] [ref=e143]
        - button "Panel de lo que suena" [pressed] [ref=e147] [cursor=pointer]
        - button "Cola" [ref=e151] [cursor=pointer]
        - button "Silenciar" [ref=e154] [cursor=pointer]
        - slider "Volumen" [ref=e159] [cursor=pointer]
    - status:
      - generic [ref=e162]: Creada «Mi lista n.º 1»
  - alert [ref=e164]: Mi lista n.º 1
```

# Test source

```ts
  1  | import { test as base, expect, type Page } from '@playwright/test';
  2  | import AxeBuilder from '@axe-core/playwright';
  3  | 
  4  | // Every test fails on console errors and 5xx responses.
  5  | export const test = base.extend<{ guard: void; allowConsole: RegExp[] }>({
  6  |   allowConsole: [[], { option: true }],
  7  |   guard: [async ({ page, allowConsole }, use) => {
  8  |     const problems: string[] = [];
  9  |     // wait for hydration after every navigation, so keyboard handlers exist
  10 |     const goto = page.goto.bind(page);
  11 |     page.goto = (async (url: string, opts?: Parameters<typeof goto>[1]) => { const r = await goto(url, opts); await page.waitForSelector('html[data-ready=true]'); return r; }) as typeof page.goto;
  12 |     page.on('console', (m) => { if (m.type() === 'error' && !allowConsole.some((re) => re.test(m.text()))) problems.push(`console: ${m.text()}`); });
  13 |     page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  14 |     page.on('response', (r) => { if (r.status() >= 500) problems.push(`${r.status()} ${r.url()}`); });
  15 |     await use();
  16 |     expect(problems, problems.join('\n')).toEqual([]);
  17 |   }, { auto: true }],
  18 | });
  19 | export { expect };
  20 | 
  21 | /** WCAG 2.1 A/AA scan of what is on screen. */
  22 | export async function axe(page: Page, label: string) {
  23 |   const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  24 |   const summary = r.violations.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.help} :: ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
> 25 |   expect(summary, `axe on ${label}`).toEqual([]);
     |                                      ^ Error: axe on Playlist (empty)
  26 | }
  27 | 
  28 | export const audio = (page: Page) => page.evaluate(() => { const a = document.querySelector('audio')!; return { t: a.currentTime, paused: a.paused, src: a.src.split('/').pop() }; });
  29 | export const player = (page: Page) => page.getByRole('region', { name: 'Reproductor' });
  30 | export async function playAlbum(page: Page, id = 'al1', title = 'Horas Lentas') {
  31 |   await page.goto(`/album/${id}`);
  32 |   await page.getByRole('button', { name: `Reproducir ${title}` }).first().click();
  33 |   await expect.poll(async () => (await audio(page)).t, { timeout: 5000 }).toBeGreaterThan(0.2);
  34 | }
  35 | 
```