// TAI DONG TIEN CHU DONG TOAN THI TRUONG THEO NGAY (de test xem dong tien co du bao loi nhuan khong - xem nghienCuuDongTienToanThiTruong.mjs).
// Voi MOI (ma, ngay) tu 2026-04-01 den ngay cuoi cua cache nen: keo tung lenh khop G1 cua ngay (DNSE REST /trades, di lui theo thoi gian vi nextPageToken khong tien), gom bang BoGopDongTien
// (chi khop lien tuc, he so KL x10) + khoi ngoai ron trong ngay -> engine/output/dong_tien_ngay.json { "MA|yyyy-mm-dd": { m, b, lm, lb, vm, vb, nn, t } } (m / b = mua / ban chu dong, lm / lb = lenh lon, vm / vb = lenh vua, trieu dong; nn = khoi ngoai ron trieu dong; t = so tick).
// Chay lai tiep tuc tu cho da luu (ghi file moi 200 cap). CHI DOC. CACH CHAY: node --env-file=.env.dnse.local engine/dich-vu/taiDongTienToanThiTruong.mjs [--gioi-han=N]
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { docJson } from "./backtestChung.mjs";
import { taoMarketData } from "../dnse/marketDataRest.js";
import { BoGopDongTien, phanTichThoiGian } from "../loi/dongTienChuDong.js";

const TU = "2026-04-01";
const FILE = fileURLToPath(new URL("../output/dong_tien_ngay.json", import.meta.url));
const cache = docJson("nen_dai.json");
const dsMa = Object.keys(cache).filter((m) => m !== "VNINDEX");
const ngayGd = cache.VCB.map((x) => x.t).filter((t) => t >= TU);
const gioiHan = Number(process.argv.find((x) => x.startsWith("--gioi-han="))?.slice(11)) || Infinity;
const md = taoMarketData({ apiKey: process.env.DNSE_API_KEY, apiSecret: process.env.DNSE_API_SECRET });
const gio = (iso) => Math.floor(new Date(iso).getTime() / 1000);
const kho = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf-8")) : {};

async function layPhien(ma, ngay) {
  const tu = gio(`${ngay}T08:55:00+07:00`);
  let den = gio(`${ngay}T15:05:00+07:00`);
  const duy = new Map();
  let khong = 0;
  for (let goi = 0; den > tu && goi < 600; goi++) {
    let r;
    for (let lan = 0; lan < 4; lan++) {
      r = await md.trades(ma, tu, den, { limit: 1000 });
      if (r.status === 200) break;
      await new Promise((x) => setTimeout(x, 800 * (lan + 1)));
    }
    if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
    const ds = r.json.trades ?? [];
    if (!ds.length) break;
    const truoc = duy.size;
    for (const x of ds) duy.set(`${x.time}|${x.matchPrice}|${x.matchQtty}|${x.totalVolumeTraded}`, x);
    const tp = phanTichThoiGian(ds[ds.length - 1].time);
    const giay = gio(`${tp.ngay}T${tp.gio}+07:00`);
    if (duy.size === truoc) { if (++khong > 3) break; den = giay - 1; continue; }
    khong = 0;
    den = giay === den ? giay - 1 : giay;
  }
  return [...duy.values()].sort((a, b) => (a.totalVolumeTraded - b.totalVolumeTraded) || (a.time < b.time ? -1 : 1));
}
async function xuLy(ma, ngay) {
  const ds = await layPhien(ma, ngay);
  if (!ds.length) return { t: 0 };
  const bo = new BoGopDongTien();
  for (const x of ds) bo.nhanTick(x);
  const t = bo.chupAnh().ma[ma];
  const fr = await md.nuocNgoai(ma, gio(`${ngay}T08:55:00+07:00`), gio(`${ngay}T15:05:00+07:00`), { limit: 1 });
  const nn = fr.json?.foreigners?.[0];
  return { m: t?.mua ?? 0, b: t?.ban ?? 0, lm: t?.lon.mua ?? 0, lb: t?.lon.ban ?? 0, vm: t?.vua.mua ?? 0, vb: t?.vua.ban ?? 0, nn: nn ? Math.round((nn.totalBuyTradedAmount - nn.totalSellTradedAmount) / 1e4) / 100 : null, t: ds.length };
}

// hang doi: ngay moi truoc, moi ma trong ngay (de neu dung giua chung thi van co cat ngang theo ngay)
const hang = [];
for (const ngay of ngayGd) for (const ma of dsMa) if (!(`${ma}|${ngay}` in kho) && cache[ma].some((x) => x.t === ngay)) hang.push([ma, ngay]);
const tong = Math.min(hang.length, gioiHan);
hang.length = tong;
console.log(`${ngayGd.length} ngay giao dich (${ngayGd[0]} .. ${ngayGd[ngayGd.length - 1]}), ${dsMa.length} ma; da co ${Object.keys(kho).length} cap; can tai ${tong} cap`);
let xong = 0, loi = 0;
const t0 = Date.now();
const luu = () => writeFileSync(FILE, JSON.stringify(kho));
await Promise.all(Array.from({ length: 6 }, async () => {
  while (hang.length) {
    const [ma, ngay] = hang.shift();
    try {
      kho[`${ma}|${ngay}`] = await xuLy(ma, ngay);
    } catch (e) {
      loi++;
      if (loi <= 10) console.log("LOI", ma, ngay, e.message);
    }
    if (++xong % 200 === 0) {
      luu();
      const giay = (Date.now() - t0) / 1000;
      console.log(`${xong}/${tong} (${loi} loi) ${Math.round(giay)}s, con ~${Math.round(((tong - xong) / xong) * giay / 60)} phut`);
    }
  }
}));
luu();
console.log(`XONG: ${Object.keys(kho).length} cap, ${loi} loi, ${Math.round((Date.now() - t0) / 60000)} phut`);
