import { _electron as electron, chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

await mkdir('artifacts', { recursive: true });
execFileSync(process.execPath, ['scripts/build-extension.mjs'], { stdio: 'inherit' });
async function exercise(page, label, copyCheck) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.locator('#password').waitFor();
  await page.locator('#length-number').fill('20');
  for (const key of ['upper', 'lower', 'digits', 'symbols']) await page.locator(`#${key}`).setChecked(true);
  const password = await page.locator('#password').inputValue();
  assert.equal(password.length, 20);
  const shortHeight = (await page.locator('#password').boundingBox()).height;
  assert.equal(await page.locator('#visibility').textContent(), '');
  assert.equal(await page.locator('#visibility .eye-open').isVisible(), true);
  await page.locator('#copy').click();
  await page.getByRole('status').filter({ hasText: 'Kopiert.' }).waitFor();
  if (copyCheck) await copyCheck(password);
  await page.locator('#visibility').click();
  assert.match(await page.locator('#password').inputValue(), /^•+$/);
  assert.equal(await page.locator('#visibility .eye-closed').isVisible(), true);
  assert.equal(await page.locator('#visibility').getAttribute('aria-label'), 'Passwort anzeigen');
  await page.locator('#visibility').click();
  assert.equal(await page.locator('#password').inputValue(), password);
  for (const key of ['upper', 'lower', 'symbols']) await page.locator(`#${key}`).uncheck();
  assert.match(await page.locator('#password').inputValue(), /^\d{20}$/);
  await page.locator('#digits').uncheck();
  assert.equal(await page.locator('#copy').isDisabled(), true);
  assert.equal(await page.locator('#password').inputValue(), '');
  await page.locator('#digits').check();
  await page.locator('#length-number').fill('7');
  assert.equal(await page.locator('#copy').isDisabled(), true);
  await page.locator('#length-number').fill('128');
  assert.equal((await page.locator('#password').inputValue()).length, 128);
  assert.ok((await page.locator('#password').boundingBox()).height > shortHeight);
  await page.locator('#length-number').fill('8');
  assert.ok((await page.locator('#password').boundingBox()).height <= shortHeight);
  assert.equal(await page.locator('#password').evaluate(field => getComputedStyle(field).resize), 'vertical');
  await page.locator('#length-number').fill('128');
  await page.locator('#excludeSimilar').check();
  assert.doesNotMatch(await page.locator('#password').inputValue(), /[01]/);
  await page.reload();
  assert.equal(await page.locator('#length-number').inputValue(), '128');
  assert.equal(await page.locator('#excludeSimilar').isChecked(), true);
  const stored = await page.evaluate(() => ({ ...localStorage }));
  assert.deepEqual(Object.keys(stored), ['password-generator.settings.v1']);
  assert.equal(Object.hasOwn(JSON.parse(stored[Object.keys(stored)[0]]), 'password'), false);
  await page.locator('#length-number').fill('20');
  for (const key of ['upper', 'lower', 'symbols']) await page.locator(`#${key}`).check();
  await page.locator('#excludeSimilar').uncheck();
  await page.screenshot({ path: `artifacts/${label}.png`, fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []);
  console.log(`${label}: generation, copy, visibility, validation, settings and layout passed`);
}

const launchEnv = { ...process.env };
delete launchEnv.ELECTRON_RUN_AS_NODE;
const app = await electron.launch({
  ...(process.env.PG_PACKAGED_EXE ? { executablePath: path.resolve(process.env.PG_PACKAGED_EXE) } : {}),
  args: [...(process.env.PG_PACKAGED_EXE ? [] : ['.']), `--user-data-dir=${await mkdtemp(path.join(tmpdir(), 'password-generator-electron-'))}`],
  env: launchEnv
});
try {
  const page = await app.firstWindow();
  await exercise(page, 'windows-app', async password => {
    assert.equal(await app.evaluate(({ clipboard }) => clipboard.readText()), password);
    await app.evaluate(({ clipboard }) => clipboard.clear());
  });
  const preferences = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences());
  assert.equal(preferences.sandbox, true);
  assert.equal(preferences.contextIsolation, true);
  assert.equal(preferences.nodeIntegration, false);
} finally { await app.close(); }

const extensionPath = path.resolve('dist/chrome-extension');
const manifest = JSON.parse(await readFile(path.join(extensionPath, 'manifest.json')));
const id = createHash('sha256').update(Buffer.from(manifest.key, 'base64')).digest('hex').slice(0, 32)
  .replace(/[0-9a-f]/g, char => String.fromCharCode(97 + parseInt(char, 16)));
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const context = await chromium.launchPersistentContext(await mkdtemp(path.join(tmpdir(), 'password-generator-chrome-')), {
  ...(existsSync(chromePath) ? { executablePath: chromePath } : { channel: 'chromium' }),
  headless: false,
  ignoreDefaultArgs: ['--disable-extensions'],
  args: ['--enable-unsafe-extension-debugging'],
  viewport: { width: 420, height: 600 }
});
try {
  const cdp = await context.browser().newBrowserCDPSession();
  const loaded = await cdp.send('Extensions.loadUnpacked', { path: extensionPath });
  assert.equal(loaded.id, id);
  const page = await context.newPage();
  await page.goto(`chrome-extension://${id}/index.html`);
  await exercise(page, 'chrome-extension');
  const bounds = await page.locator('.shell').boundingBox();
  assert.ok(bounds.height <= 600, `Popup too tall: ${bounds.height}`);
  await page.evaluate(() => navigator.clipboard.writeText(''));
} finally { await context.close(); }
