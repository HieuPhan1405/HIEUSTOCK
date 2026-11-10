// TAO ANH CHIA SE (og:image) 1200x630 cho web: public/og-cloudstock.png. Chay lai khi doi logo / cau gioi thieu: node scripts/taoAnhChiaSe.mjs
// Ve bang SVG (chu dung phong he thong co dau tieng Viet) + ghep logo that (public/logo-day-du-toi.png) bang sharp (da co san theo Next).
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { statSync } from "node:fs";

const goc = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const W = 1200;
const H = 630;
const PHONG = "'Segoe UI', 'Open Sans', Arial, sans-serif";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="tim" cx="18%" cy="8%" r="75%">
      <stop offset="0%" stop-color="#6C5CE7" stop-opacity="0.55"/>
      <stop offset="55%" stop-color="#6C5CE7" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#6C5CE7" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="xanh" cx="92%" cy="96%" r="55%">
      <stop offset="0%" stop-color="#22C55E" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="#22C55E" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="chu" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#A29BFE"/>
      <stop offset="100%" stop-color="#5BC8F5"/>
    </linearGradient>
    <pattern id="luoi" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="#FFFFFF" stroke-opacity="0.04" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="#0B0B10"/>
  <rect width="${W}" height="${H}" fill="url(#luoi)"/>
  <rect width="${W}" height="${H}" fill="url(#tim)"/>
  <rect width="${W}" height="${H}" fill="url(#xanh)"/>
  <text x="80" y="330" font-family="${PHONG}" font-size="68" font-weight="700" fill="#FFFFFF">Tổng quan thị trường,</text>
  <text x="80" y="412" font-family="${PHONG}" font-size="68" font-weight="700" fill="url(#chu)">đọc trong 5 giây.</text>
  <text x="80" y="478" font-family="${PHONG}" font-size="28" fill="#B4B4C4">Xu hướng · Động lượng · Dòng tiền của cổ phiếu HOSE, HNX, UPCOM</text>
  <text x="80" y="520" font-family="${PHONG}" font-size="28" fill="#B4B4C4">Bộ lọc, biểu đồ kỹ thuật, dashboard thị trường — cập nhật sau mỗi phiên</text>
  <rect x="80" y="556" width="268" height="40" rx="20" fill="#6C5CE7" fill-opacity="0.22" stroke="#6C5CE7" stroke-opacity="0.6"/>
  <text x="214" y="583" text-anchor="middle" font-family="${PHONG}" font-size="22" font-weight="600" fill="#FFFFFF">cloudstock.id.vn</text>
  <text x="${W - 80}" y="583" text-anchor="end" font-family="${PHONG}" font-size="20" fill="#8B8B99">Thông tin tham khảo, không phải khuyến nghị đầu tư</text>
</svg>`;

const logo = await sharp(path.join(goc, "public/logo-day-du-toi.png")).resize({ height: 190 }).toBuffer();
await sharp(Buffer.from(svg))
  .composite([{ input: logo, left: 72, top: 44 }])
  .png({ compressionLevel: 9, palette: false })
  .toFile(path.join(goc, "public/og-cloudstock.png"));
const m = await sharp(path.join(goc, "public/og-cloudstock.png")).metadata();
console.log("da tao public/og-cloudstock.png", m.width, "x", m.height, Math.round(statSync(path.join(goc, "public/og-cloudstock.png")).size / 1024) + " KB");
