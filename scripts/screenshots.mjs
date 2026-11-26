#!/usr/bin/env node
/**
 * Captures README screenshots of the production build in a phone-sized
 * Chromium, in light and dark mode.
 *
 *   npm run build && npm run screenshots
 *
 * Output: docs/screenshots/<screen>-<theme>.png
 *
 * Runs are deterministic (frozen clock, fixed demo data, fixed device,
 * animations off), so the images only change when the UI does.
 */
import { createServer } from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium, devices } from 'playwright';

const ROOT = resolve(import.meta.dirname, '..');
const WEB_DIR = join(ROOT, 'www');
const OUT_DIR = join(ROOT, 'docs', 'screenshots');

const DEVICE = devices['Pixel 7']; // Android look (Ionic "md" mode), matching the APK.
const THEMES = ['light', 'dark'];
const FIXED_NOW = new Date('2026-01-15T10:00:00Z');

const DEMO_EXPENSES = [
  { name: 'Weekly groceries', date: '12.1.2026', category: 'Food', amount: 64.3 },
  { name: 'Monthly train pass', date: '10.1.2026', category: 'Transport', amount: 49 },
  { name: 'Fibre internet', date: '5.1.2026', category: 'Internet', amount: 39.99 },
  { name: 'Car service', date: '3.1.2026', category: 'Car', amount: 120 },
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

/** Static server for www/ with SPA fallback to index.html. */
async function startServer() {
  try {
    await stat(join(WEB_DIR, 'index.html'));
  } catch {
    throw new Error(`No build found in ${WEB_DIR}. Run "npm run build" first.`);
  }

  const server = createServer(async (req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = normalize(join(WEB_DIR, urlPath));
    if (!file.startsWith(WEB_DIR)) {
      res.writeHead(403).end();
      return;
    }
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    } catch {
      file = join(WEB_DIR, 'index.html');
    }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });

  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return { server, baseUrl: `http://127.0.0.1:${server.address().port}` };
}

/** The screens to capture. Each gets a fresh page already showing `path`. */
const SCREENS = [
  {
    name: 'add-expense',
    path: '/add-expense',
    async prepare(page) {
      await page.locator('ion-input input').first().fill('Weekly groceries');
      await page.locator('ion-input[type="number"] input').fill('64.30');
      await page.locator('ion-select').click();
      await page.getByRole('radio', { name: 'Food' }).click();
      await page.locator('ion-alert').getByRole('button', { name: 'OK' }).click();
      await page.locator('ion-alert').waitFor({ state: 'detached' });
      await page.locator('ion-input input').first().blur();
    },
  },
  {
    name: 'categories',
    path: '/add-expense',
    async prepare(page) {
      await page.locator('ion-icon[name="create-outline"]').click();
      await page.locator('ion-modal app-store-names-modal ion-item').first().waitFor();
    },
  },
  {
    name: 'view-expenses',
    path: '/view-expenses',
    async prepare(page) {
      await page.getByText('Total Expenses').waitFor();
    },
  },
  {
    name: 'edit-expense',
    path: '/view-expenses',
    async prepare(page) {
      await page.locator('ion-item.expense-item', { hasText: 'Weekly groceries' }).click();
      await page.locator('app-edit-expense-modal ion-datetime').waitFor();
    },
  },
];

async function capture(browser, baseUrl, theme, screen) {
  const context = await browser.newContext({
    ...DEVICE,
    colorScheme: theme,
    locale: 'en-US',
    timezoneId: 'UTC',
  });
  await context.addInitScript(expenses => {
    // Fixed demo data, and no Ionic transitions so captures are stable.
    localStorage.setItem('expenses', JSON.stringify(expenses));
    window.Ionic = { config: { animated: false } };
  }, DEMO_EXPENSES);

  const page = await context.newPage();
  await page.clock.setFixedTime(FIXED_NOW);
  await page.goto(baseUrl + screen.path, { waitUntil: 'networkidle' });
  await page.locator('ion-content.hydrated').first().waitFor();
  await screen.prepare(page);
  // Let icons, fonts and the last layout pass settle.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);

  const file = join(OUT_DIR, `${screen.name}-${theme}.png`);
  await page.screenshot({ path: file, animations: 'disabled', caret: 'hide' });
  await context.close();
  return file;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const { server, baseUrl } = await startServer();
  const browser = await chromium.launch();
  try {
    for (const theme of THEMES) {
      for (const screen of SCREENS) {
        const file = await capture(browser, baseUrl, theme, screen);
        console.log(`✔ ${file.replace(ROOT + '/', '')}`);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
