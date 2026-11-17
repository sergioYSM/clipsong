import { test as base, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Every test fails on console errors and 5xx responses.
export const test = base.extend<{ guard: void; allowConsole: RegExp[] }>({
  allowConsole: [[], { option: true }],
  guard: [async ({ page, allowConsole }, use) => {
    const problems: string[] = [];
    // wait for hydration after every navigation, so keyboard handlers exist
    const goto = page.goto.bind(page);
    page.goto = (async (url: string, opts?: Parameters<typeof goto>[1]) => { const r = await goto(url, opts); await page.waitForSelector('html[data-ready=true]'); return r; }) as typeof page.goto;
    page.on('console', (m) => { if (m.type() === 'error' && !allowConsole.some((re) => re.test(m.text()))) problems.push(`console: ${m.text()}`); });
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    page.on('response', (r) => { if (r.status() >= 500) problems.push(`${r.status()} ${r.url()}`); });
    await use();
    expect(problems, problems.join('\n')).toEqual([]);
  }, { auto: true }],
});
export { expect };

/** WCAG 2.1 A/AA scan of what is on screen. */
export async function axe(page: Page, label: string) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const summary = r.violations.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.help} :: ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
  expect(summary, `axe on ${label}`).toEqual([]);
}

export const audio = (page: Page) => page.evaluate(() => { const a = document.querySelector('audio')!; return { t: a.currentTime, paused: a.paused, src: a.src.split('/').pop() }; });
export const player = (page: Page) => page.getByRole('region', { name: 'Reproductor' });
export async function playAlbum(page: Page, id = 'al1', title = 'Horas Lentas') {
  await page.goto(`/album/${id}`);
  await page.getByRole('button', { name: `Reproducir ${title}` }).first().click();
  await expect.poll(async () => (await audio(page)).t, { timeout: 5000 }).toBeGreaterThan(0.2);
}
