// End-to-end check of the vertical slice: sign up -> search -> play -> like ->
// Liked songs, and music keeps playing across navigation. Plus screenshots.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = process.env.BASE ?? 'http://localhost:3000';
const SHOTS = process.env.SHOTS;
const errors = [];
const ok = (cond, msg) => { if (!cond) { console.log('FAIL', msg); process.exitCode = 1; } else console.log('ok  ', msg); };

const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
p.on('pageerror', (e) => errors.push(String(e)));
const audio = () => p.evaluate(() => { const a = document.querySelector('audio'); return { t: a.currentTime, paused: a.paused, src: a.src }; });

await p.goto(BASE + '/');
await p.getByText('Aún no has escuchado nada.').waitFor();
ok(true, 'home shows the new-user empty state');
if (SHOTS) await p.screenshot({ path: `${SHOTS}/S03-home-empty.png` });

await p.goto(BASE + '/login');
await p.getByLabel('Cómo te llamamos').fill('Ana');
await p.getByLabel('Correo electrónico').fill('no-es-un-correo');
await p.getByRole('button', { name: 'Crear cuenta' }).click();
ok(await p.locator('#email-err').isVisible(), 'sign up rejects an invalid email');
await p.getByLabel('Correo electrónico').fill('ana@example.com');
await p.getByRole('button', { name: 'Crear cuenta' }).click();
await p.waitForURL(BASE + '/');
ok(await p.getByRole('heading', { name: /Ana/ }).isVisible(), 'signed in, greeted by name');

await p.locator('#global-search').fill('cafe');
await p.waitForURL(/search\?q=cafe/);
await p.getByText('Mejor resultado').waitFor();
ok(await p.getByText('Café a las siete').first().isVisible(), 'search is accent-insensitive ("cafe" finds "Café")');
await p.locator('#global-search').fill('marea vaja');
await p.waitForURL(/marea/);
await p.waitForTimeout(300);
ok(await p.getByText('Marea Baja').first().isVisible(), 'search tolerates a typo ("vaja")');
if (SHOTS) await p.screenshot({ path: `${SHOTS}/S05-search.png` });
await p.locator('#global-search').fill('zzzzqqq');
await p.getByText('Nada con «zzzzqqq»').waitFor();
ok(true, 'search no-results state');

await p.goto(BASE + '/album/al1');
await p.getByRole('button', { name: 'Reproducir Horas Lentas' }).click();
await p.waitForTimeout(1500);
let a = await audio();
ok(!a.paused && a.t > 0.3 && a.src.endsWith('/audio/t01.mp3'), `album plays from track 1 (t=${a.t.toFixed(1)})`);
ok(await p.getByRole('region', { name: 'Reproductor' }).getByText('Café a las siete').isVisible(), 'player bar shows the track');

// continuous playback across client-side navigation
const before = (await audio()).t;
const player = p.getByRole('region', { name: 'Reproductor' });
await player.getByRole('link', { name: 'Marea Baja' }).click(); await p.waitForURL(/artist\/ar1/);
await p.getByRole('link', { name: 'Inicio' }).click(); await p.waitForURL(BASE + '/');
await p.getByRole('navigation', { name: 'Tu biblioteca' }).getByRole('link', { name: /Me gustan/ }).click(); await p.waitForURL(/collection\/tracks/);
await player.getByRole('link', { name: 'Ir al álbum Horas Lentas' }).click(); await p.waitForURL(/album\/al1/);
await p.waitForTimeout(500);
a = await audio();
ok(!a.paused && a.t > before, `music kept playing through 4 route changes (${before.toFixed(1)}s -> ${a.t.toFixed(1)}s)`);

// like from the player bar, find it in Liked songs
await p.getByRole('region', { name: 'Reproductor' }).getByRole('button', { name: 'Guardar en Me gustan' }).click();
await p.goto(BASE + '/collection/tracks');
ok(await p.getByRole('row', { name: /Café a las siete/ }).isVisible(), 'liked song appears in Me gustan');
if (SHOTS) await p.screenshot({ path: `${SHOTS}/S09-liked.png` });

// next / queue / shuffle basics
await p.goto(BASE + '/album/al1');
await p.getByRole('button', { name: 'Reproducir Horas Lentas' }).click();
await p.waitForTimeout(500);
await p.getByRole('button', { name: 'Siguiente', exact: true }).click();
await p.waitForTimeout(600);
ok((await audio()).src.endsWith('/audio/t02.mp3'), 'next goes to track 2');
await p.getByRole('row', { name: /Domingo sin prisa/ }).click({ button: 'right' });
await p.getByRole('menuitem', { name: 'Añadir a la cola' }).click();
await p.getByRole('button', { name: 'Siguiente', exact: true }).click();
await p.waitForTimeout(600);
ok((await audio()).src.endsWith('/audio/t03.mp3'), 'queued song plays next');

// playlist: create, add via context menu, rename
await p.getByRole('button', { name: 'Crear lista' }).first().click();
await p.waitForURL(/\/playlist\//);
ok(await p.getByText('Esta lista está vacía').isVisible(), 'new playlist shows empty state');
await p.getByLabel('Buscar canciones para añadir').fill('valle');
await p.getByRole('button', { name: 'Añadir' }).first().click();
ok(await p.getByRole('row', { name: /Valle abierto/ }).isVisible(), 'song added to playlist');
await p.getByRole('button', { name: 'Editar detalles' }).click();
await p.getByLabel('Nombre').fill('Intro del vlog');
await p.getByRole('dialog').getByRole('button', { name: 'Guardar', exact: true }).click();
ok(await p.getByRole('heading', { name: 'Intro del vlog' }).isVisible(), 'playlist renamed');
if (SHOTS) await p.screenshot({ path: `${SHOTS}/S08-playlist.png` });

// licence filter + copy credit
await p.goto(BASE + '/album/al1');
await p.getByRole('button', { name: 'Apta para monetizar' }).first().click();
ok(!(await p.getByRole('row', { name: /Domingo sin prisa/ }).count()), 'monetizable filter hides the CC BY-NC song');
await p.getByRole('button', { name: 'Apta para monetizar' }).first().click();
await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
await p.getByRole('row', { name: /Café a las siete/ }).click({ button: 'right' });
await p.getByRole('menuitem', { name: 'Copiar crédito' }).click();
const clip = await p.evaluate(() => navigator.clipboard.readText());
ok(clip.includes('Café a las siete') && clip.includes('CC BY 4.0') && clip.includes('creativecommons.org'), 'copy credit puts title, licence and URL on the clipboard');
if (SHOTS) await p.screenshot({ path: `${SHOTS}/S06-album.png` });

await p.goto(BASE + '/artist/ar5'); if (SHOTS) await p.screenshot({ path: `${SHOTS}/S07-artist.png` });
await p.goto(BASE + '/'); if (SHOTS) await p.screenshot({ path: `${SHOTS}/S03-home.png` });

// mobile
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
m.on('pageerror', (e) => errors.push(String(e)));
for (const path of ['/', '/album/al5', '/search?q=lo', '/collection', '/queue']) {
  await m.goto(BASE + path); await m.waitForTimeout(300);
  const sw = await m.evaluate(() => document.documentElement.scrollWidth);
  ok(sw <= 390, `390px: no horizontal scroll on ${path} (${sw})`);
}
if (SHOTS) { await m.goto(BASE + '/album/al5'); await m.screenshot({ path: `${SHOTS}/S06-album-mobile.png` }); }

ok(errors.length === 0, `no console errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
await b.close();
