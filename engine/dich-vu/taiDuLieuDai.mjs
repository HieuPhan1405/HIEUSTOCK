// Tai lich su gia DAI (toi da ~13 nam, tuy ngay niem yet) cua vu tru quet tu VNDirect finfo (gia DA DIEU CHINH co tuc/thuong
// - adOpen/adHigh/adLow/adClose, KL khop lenh nmVolume) ra cache cuc bo engine/output/nen_dai.json (da gitignore) - de kiem
// chung backtest tren nhieu chu ky thi truong hon 4.4 nam cua DNSE. Chi DOC, khong ghi/gui gi len web.
// Dinh dang giong nen_backtest.json: { MA: [{ t:"YYYY-MM-DD", o, h, l, c, v }] } tang dan theo ngay.
// CACH CHAY: node engine/dich-vu/taiDuLieuDai.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { danhSachMaQuet } from "../loi/quetToanBo.js";

const dsMa = danhSachMaQuet();
const SONG_SONG = 4;
const cho = (ms) => new Promise((r) => setTimeout(r, ms));

async function layMa(ma) {
  const url = `https://api-finfo.vndirect.com.vn/v4/stock_prices?sort=date:desc&q=code:${ma}&size=5000&fields=date,adOpen,adHigh,adLow,adClose,nmVolume`;
  let loiCuoi;
  for (let lan = 1; lan <= 3; lan++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const nen = (j.data || [])
        .filter((d) => d.adClose > 0 && d.adOpen > 0 && d.adHigh > 0 && d.adLow > 0)
        .map((d) => ({ t: d.date, o: d.adOpen, h: d.adHigh, l: d.adLow, c: d.adClose, v: d.nmVolume ?? 0 }))
        .reverse();
      return nen;
    } catch (e) {
      loiCuoi = e;
      await cho(700 * lan);
    }
  }
  throw loiCuoi;
}

const ketQua = {};
const loi = [];
let xong = 0;
let con = [...dsMa];
async function tho() {
  while (con.length) {
    const ma = con.shift();
    try {
      const nen = await layMa(ma);
      if (nen.length >= 150) ketQua[ma] = nen;
      else loi.push(`${ma}: chi ${nen.length} nen`);
    } catch (e) {
      loi.push(`${ma}: ${String(e.message || e).slice(0, 60)}`);
    }
    xong++;
    if (xong % 40 === 0 || xong === dsMa.length) console.log(`${xong}/${dsMa.length} ma (${loi.length} loi)`);
    await cho(120);
  }
}
await Promise.all(Array.from({ length: SONG_SONG }, tho));

const thuMuc = fileURLToPath(new URL("../output/", import.meta.url));
mkdirSync(thuMuc, { recursive: true });
writeFileSync(thuMuc + "nen_dai.json", JSON.stringify(ketQua), "utf-8");
const soNen = Object.values(ketQua).map((n) => n.length);
console.log(`Da luu ${Object.keys(ketQua).length} ma; nen/ma: min ${Math.min(...soNen)}, max ${Math.max(...soNen)}, tb ${Math.round(soNen.reduce((a, b) => a + b, 0) / soNen.length)}`);
console.log("Ngay som nhat:", Object.values(ketQua).map((n) => n[0].t).sort()[0]);
if (loi.length) console.log("Loi:", loi.slice(0, 15).join(" | "));
