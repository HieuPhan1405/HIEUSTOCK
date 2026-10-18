// Chụp các khối trang "Thị trường" (cloudstock.id.vn) làm B-roll cho video giới thiệu (viewport 430, scale 2.5).
// Dùng: node capture_intro.mjs <outDir>   (NSS phải tin CA proxy; playwright-core ở PW_DIR)
// Chỉ lấy: thanh trên có logo, tiêu đề, Nhận định nhanh, PTKT VNINDEX, ô Mã đang theo dõi / Xu hướng tăng,
// Kết luận thị trường, Độ rộng theo vốn hoá, dòng thời điểm cập nhật.
// KHÔNG chụp: khối "Top cơ hội" (tín hiệu MUA/BÁN), Mắt Thần, chốt lời, bán bớt, số điện thoại, Zalo, ủng hộ ngân hàng.
import { createRequire } from 'module';
const require = createRequire((process.env.PW_DIR || '/tmp/claude-0/shot') + '/');
const { chromium } = require('playwright-core');
const out = process.argv[2] || '.';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2.5, locale: 'vi-VN' });
const page = await ctx.newPage();
await page.goto('https://www.cloudstock.id.vn/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(4000);
// ẩn nút chat/nút nổi; giữ thanh trên (có logo)
await page.evaluate(() => {
  for (const e of document.querySelectorAll('*')) {
    const s = getComputedStyle(e);
    if (s.position === 'fixed') { const r = e.getBoundingClientRect(); if (r.top > 300 || r.width < 120) e.style.visibility = 'hidden'; }
  }
});
await page.mouse.move(2, 2);
// vị trí các khối theo văn bản neo (lấy tổ tiên dạng thẻ bo góc)
const boxes = await page.evaluate(() => {
  const all = [...document.querySelectorAll('body *')];
  const find = (txt, up) => {
    const el = all.find(e => e.children.length === 0 && (e.textContent || '').trim().toLowerCase().startsWith(txt.toLowerCase()));
    if (!el) return null;
    let p = el; for (let i = 0; i < up; i++) p = p.parentElement;
    const r = p.getBoundingClientRect();
    return { x: r.left, y: r.top + scrollY, w: r.width, h: r.height };
  };
  const upd = all.find(e => e.children.length === 0 && /^15:30|^\d\d:\d\d \d\d\/\d\d\/\d{4}/.test((e.textContent || '').trim()));
  let updBox = null;
  if (upd) { let p = upd.parentElement; const r = p.getBoundingClientRect(); updBox = { x: r.left, y: r.top + scrollY, w: r.width, h: r.height }; }
  const tiles = find('Mã đang theo dõi', 1);
  return {
    nhandinh: find('NHẬN ĐỊNH NHANH', 2),
    ptkt: find('PTKT VNINDEX', 3),
    tiles: tiles && { x: 24, y: tiles.y, w: 382, h: tiles.h },
    ketluan: find('KẾT LUẬN THỊ TRƯỜNG', 2),
    dorong: find('ĐỘ RỘNG THEO VỐN HOÁ', 1),
    capnhat: updBox,
  };
});
console.log(JSON.stringify(boxes));
const shot = (name, b, pad = 0) => page.screenshot({ path: `${out}/${name}.png`, fullPage: true, clip: { x: Math.max(0, b.x - pad), y: b.y - pad, width: Math.min(430, b.w + 2 * pad), height: b.h + 2 * pad } });
await page.screenshot({ path: `${out}/header_logo.png`, clip: { x: 0, y: 0, width: 430, height: 100 } });
// chỉ lấy dòng nhãn + tiêu đề (đoạn mô tả bên dưới có chữ "backtest", không đưa vào video)
await page.screenshot({ path: `${out}/hero_title.png`, clip: { x: 0, y: 192, width: 430, height: 140 } });
for (const k of ['nhandinh', 'ptkt', 'tiles', 'ketluan', 'dorong', 'capnhat']) if (boxes[k]) await shot(k, boxes[k], 4);
// gộp Kết luận + Độ rộng thành một ảnh (dùng cho đoạn ví dụ 16/10)
if (boxes.ketluan && boxes.dorong) {
  const y0 = boxes.ketluan.y, y1 = boxes.dorong.y + boxes.dorong.h;
  await shot('ketluan_dorong', { x: 24, y: y0, w: 382, h: y1 - y0 }, 4);
}
await browser.close();
