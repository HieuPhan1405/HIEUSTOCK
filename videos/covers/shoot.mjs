// Chụp các cover_*.html thành PNG đúng kích cỡ. PW_DIR: nơi cài playwright-core.
import { createRequire } from 'module';
import { readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const require = createRequire((process.env.PW_DIR || '/tmp/claude-0/shot') + '/');
const { chromium } = require('playwright-core');
const dir = dirname(fileURLToPath(import.meta.url));
const CH = process.env.CHROME || ['/opt/pw-browsers/chromium-1243/chrome-linux/chrome', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);
const browser = await chromium.launch({ executablePath: CH, args: ['--no-sandbox', '--allow-file-access-from-files'] });
for (const f of readdirSync(dir).filter(f => new RegExp('^'+(process.env.PREFIX||'cover')+'_.*\\.html$').test(f))) {
  const m = f.match(/_(\d+)x(\d+)\.html$/);
  const page = await browser.newPage({ viewport: { width: +m[1], height: +m[2] } });
  await page.goto('file://' + resolve(dir, f));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(dir, f.replace('.html', '.png')) });
  console.log(f.replace('.html', '.png'));
  await page.close();
}
await browser.close();
