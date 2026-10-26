// Tai nen ngay GAN DAY (700 phien) cua ~390 ma tu VNDirect finfo (gia dieu chinh) -> engine/output/nen_gan.json. Nhe hon taiDuLieuDai.mjs (13 nam), dung cho lich cap nhat RRG / phan tich co ban hang ngay.
// Ma tai loi giu lai du lieu cu trong file truoc; thoat voi ma 1 neu duoi 90% so ma tai duoc (nguon loi) de lich khong day du lieu thieu len web.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { danhSachMaQuet } from "../loi/quetToanBo.js";

const FILE = new URL("../output/nen_gan.json", import.meta.url);
const dsMa = danhSachMaQuet();
const cu = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : {};
const cho = (ms) => new Promise((r) => setTimeout(r, ms));

async function layMa(ma) {
  const url = `https://api-finfo.vndirect.com.vn/v4/stock_prices?sort=date:desc&q=code:${ma}&size=700&fields=date,adOpen,adHigh,adLow,adClose,nmVolume`;
  let loiCuoi;
  for (let lan = 1; lan <= 3; lan++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      return (j.data || [])
        .filter((d) => d.adClose > 0 && d.adOpen > 0 && d.adHigh > 0 && d.adLow > 0)
        .map((d) => ({ t: d.date, o: d.adOpen, h: d.adHigh, l: d.adLow, c: d.adClose, v: d.nmVolume ?? 0 }))
        .reverse();
    } catch (e) {
      loiCuoi = e;
      await cho(700 * lan);
    }
  }
  throw loiCuoi;
}

const moi = {};
let loi = 0;
const con = [...dsMa];
async function tho() {
  while (con.length) {
    const ma = con.shift();
    try {
      const nen = await layMa(ma);
      if (nen.length >= 150) moi[ma] = nen;
      else loi++;
    } catch {
      loi++;
    }
    await cho(100);
  }
}
await Promise.all(Array.from({ length: 4 }, tho));
const soTai = Object.keys(moi).length;
if (soTai < dsMa.length * 0.9) {
  console.error(`Chi tai duoc ${soTai}/${dsMa.length} ma - bo qua, giu nguyen nen_gan.json cu`);
  process.exit(1);
}
const ketQua = { ...cu, ...moi };
writeFileSync(FILE, JSON.stringify(ketQua));
console.log(`nen_gan.json: ${soTai} ma moi (${loi} loi, giu du lieu cu), tong ${Object.keys(ketQua).length} ma, nen cuoi VCB ${ketQua.VCB?.at(-1)?.t}`);
