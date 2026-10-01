// Chụp các trang chính của cloudstock.id.vn (viewport 430 rộng, scale 2.5) cho video quảng cáo web.
// Dùng: node capture_pages.mjs <outDir>   (NSS phải tin CA proxy; playwright-core ở PW_DIR)
import { createRequire } from 'module';
const require = createRequire((process.env.PW_DIR || '/tmp/claude-0/shot') + '/');
const { chromium } = require('playwright-core');
const out = process.argv[2] || '.';
const pages = [
  ['home', '/', 1250], ['boloc', '/bo-loc', 900], ['bieudo', '/bieu-do', 1250], ['dashboard', '/dashboard', 1500],
  ['danhmuc', '/danh-muc', 640], ['batday', '/bat-day', 640], ['lenhmo', '/lenh-mo', 640],
];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2.5, locale: 'vi-VN' });
for (const [name, path, h] of pages) {
  const page = await ctx.newPage();
  await page.goto('https://www.cloudstock.id.vn' + path, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(4000);
  // ẩn nút chat / nút nổi (giữ thanh trên cùng)
  await page.evaluate(() => {
    for (const e of document.querySelectorAll('*')) {
      const s = getComputedStyle(e);
      if (s.position === 'fixed') { const r = e.getBoundingClientRect(); if (r.top > 300 || r.width < 120) e.style.visibility = 'hidden'; }
    }
  });
  await page.mouse.move(2, 2);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true, clip: { x: 0, y: 0, width: 430, height: h } });
  console.log(name, 'ok');
  await page.close();
}
await browser.close();
