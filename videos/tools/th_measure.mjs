// Đo hộp chữ/hình của từng thẻ ở trạng thái cuối (sau animation) → báo thẻ nào lấn ra ngoài vùng an toàn TikTok
// hoặc đè lên vùng caption (y ≥ 1170).   Dùng: node th_measure.mjs <thư mục video>   (cần public/index.html đã build)
// Vùng an toàn 1080x1920: x 60..940, y 170..1430. In: top/bottom của nội dung mỗi thẻ + cảnh báo.
import { createRequire } from 'module';
import path from 'path';
const require = createRequire((process.env.PW_DIR || '/tmp/claude-0/shot') + '/');
const { chromium } = require('playwright-core');
const dir = path.resolve(process.argv[2] || '.');
const only = process.argv[3]; // tuỳ chọn: id thẻ
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto('file://' + dir + '/public/index.html');
await page.waitForTimeout(1500);
await page.evaluate(() => document.fonts.ready);
const res = await page.evaluate(({ only }) => {
  const tl = window.__timelines['talking-head-recut'];
  const out = [];
  document.querySelectorAll('.card-host').forEach(h => {
    const id = h.dataset.cardId;
    if (only && id !== only) return;
    const s = parseFloat(h.dataset.start), d = parseFloat(h.dataset.duration);
    const full = h.dataset.trackIndex === '4';
    tl.time(s + d - 0.06, false); // trạng thái cuối của thẻ (trước khi mờ đi)
    h.style.visibility = 'visible'; h.style.opacity = '1';
    const items = [];
    h.querySelectorAll('*').forEach(el => {
      if (el.closest('style')) return;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || el.tagName === 'STYLE') return;
      const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      const isMedia = ['IMG', 'SVG', 'CANVAS'].includes(el.tagName.toUpperCase());
      if (!hasText && !isMedia) return;
      if (parseFloat(cs.opacity) < 0.05) return;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      items.push({ t: (el.textContent || el.tagName).trim().slice(0, 28), x: r.left, y: r.top, r: r.right, b: r.bottom });
    });
    const top = Math.min(...items.map(i => i.y)), bottom = Math.max(...items.map(i => i.b));
    const left = Math.min(...items.map(i => i.x)), right = Math.max(...items.map(i => i.r));
    const bad = items.filter(i => i.x < 59 || i.r > 941 || i.y < 169 || i.b > 1431);
    out.push({ id, full, s, e: s + d, top: Math.round(top), bottom: Math.round(bottom), left: Math.round(left), right: Math.round(right), bad: bad.map(b => `${b.t} [${Math.round(b.x)},${Math.round(b.y)}→${Math.round(b.r)},${Math.round(b.b)}]`) });
    h.style.visibility = 'hidden'; h.style.opacity = '0';
  });
  return out;
}, { only });
for (const c of res) {
  const warn = [];
  if (!c.full && c.bottom > 760) warn.push('thẻ che mặt người nói (bottom > 760)');
  if (c.bottom > 1160) warn.push('chạm vùng caption (>1160)');
  console.log(`${c.id.padEnd(12)} ${c.full ? 'FULL' : 'top '}  y ${String(c.top).padStart(4)}–${String(c.bottom).padEnd(4)} x ${String(c.left).padStart(4)}–${String(c.right).padEnd(4)}  ${warn.join('; ')}`);
  for (const b of c.bad) console.log('    ngoài vùng an toàn:', b);
}
await browser.close();
