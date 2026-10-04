// Chụp khối giá + biểu đồ từ cloudstock.id.vn/ma/<MÃ> (viewport 430x932, scale 2.5).
// Dùng: node capture_cloudstock.mjs <outDir> TRC GVR ...   (NSS phải tin CA proxy, không tắt TLS)
// Xuất: <outDir>/price_<MÃ>.png (giá/%/KL/vốn hoá) và <outDir>/chart_<MÃ>.png (biểu đồ).
// KHÔNG chụp khối "KẾT LUẬN"/điểm hợp lưu/vùng lệnh — dễ bị hiểu là khuyến nghị.
import { createRequire } from 'module';
// playwright-core: `npm i playwright-core` trong PW_DIR (mặc định /tmp/claude-0/shot)
const require = createRequire((process.env.PW_DIR || '/tmp/claude-0/shot') + '/');
const { chromium } = require('playwright-core');
const [out, ...syms] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2.5, locale: 'vi-VN' });
for (const s of syms) {
  let ok = false;
  for (let attempt = 0; attempt < 4 && !ok; attempt++) {
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      // bỏ nhãn tín hiệu MUA/BÁN trên canvas (không đưa tín hiệu vào video công khai)
      const ft = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (t, ...r) {
        if (/^(MUA|BÁN|BAN)$/.test(String(t))) return;
        return ft.call(this, t, ...r);
      };
    });
    try {
      await page.goto(`https://www.cloudstock.id.vn/ma/${s}`, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(4000);
      const has = await page.evaluate(() => /KL TB20/.test(document.body.innerText));
      if (!has) throw new Error('chưa có dữ liệu');
      await page.addStyleTag({ content: 'header,nav,[class*="sticky"],[class*="fixed"]{visibility:hidden!important}' });
      const priceBox = await page.evaluate(() => {
        const p = [...document.querySelectorAll('p')].find(e => /KL TB20/.test(e.textContent));
        const r = p.parentElement.getBoundingClientRect();
        return { x: r.left, y: r.top + scrollY, w: r.width, h: r.height };
      });
      await page.screenshot({ path: `${out}/price_${s}.png`, fullPage: true, clip: { x: priceBox.x, y: priceBox.y + 6, width: priceBox.w, height: priceBox.h - 6 } });
      // Tắt Vùng lệnh + các lớp chỉ báo (giữ nến + khối lượng), khung 3T
      await page.evaluate(() => {
        const B = [...document.querySelectorAll('button')];
        const by = t => B.find(b => b.innerText.trim() === t);
        const off = getComputedStyle(by('Tuần')).backgroundColor;
        for (const t of ['Vùng lệnh', 'Ichimoku', 'Cân bằng dài hạn', 'MA 20/50/200']) {
          const b = by(t);
          if (b && getComputedStyle(b).backgroundColor !== off) b.click();
        }
        by('3T')?.click();
      });
      await page.waitForTimeout(1500);
      const tbl = page.locator('table').filter({ has: page.locator('canvas') }).first();
      await tbl.scrollIntoViewIfNeeded();
      await page.mouse.move(2, 2);
      await page.waitForTimeout(800);
      // chụp theo toạ độ (clip) thay vì element.screenshot: tránh bảng bị nở ngang khi mã có lệnh mở
      const bb = await tbl.evaluate(el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, w: Math.min(r.width, 430 - r.left), h: r.height }; });
      await page.screenshot({ path: `${out}/chart_${s}.png`, fullPage: true, clip: { x: bb.x, y: bb.y, width: bb.w, height: bb.h } });
      console.log(s, 'ok');
      ok = true;
    } catch (e) {
      console.log(s, 'thử lại:', e.message.slice(0, 80));
    }
    await page.close();
  }
}
await browser.close();
