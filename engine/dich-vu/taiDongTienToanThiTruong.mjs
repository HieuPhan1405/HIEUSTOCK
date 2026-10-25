// TAI DONG TIEN CHU DONG TOAN THI TRUONG THEO NGAY (de test xem dong tien co du bao loi nhuan khong - xem nghienCuuDongTienToanThiTruong.mjs).
// Voi MOI (ma, ngay) tu 2026-04-01 den ngay cuoi cua cache nen: keo tung lenh khop G1 cua ngay (DNSE REST /trades, di lui theo thoi gian vi nextPageToken khong tien), gom bang BoGopDongTien
// (chi khop lien tuc, he so KL x10) + khoi ngoai ron trong ngay -> engine/output/dong_tien_ngay.json { "MA|yyyy-mm-dd": { m, b, lm, lb, vm, vb, nn, t } } (m / b = mua / ban chu dong, lm / lb = lenh lon, vm / vb = lenh vua, trieu dong; nn = khoi ngoai ron trieu dong; t = so tick).
// Chay lai tiep tuc tu cho da luu (ghi file moi 100 cap). CHI DOC.
// GIOI HAN TAN SUAT CUA DNSE (do ngay 26/10/2026): khoang 6.000-10.000 goi REST / dot, vuot thi HTTP 429 "Rate Limit Exceeded" va bi chan ~38 PHUT (tai toan thi truong ~175.000 goi = vai chuc gio neu chay het toc do).
// Nen script: gioi han toc do toan cuc (--toc-do=2.5 goi/giay, ~9.000 goi / gio), gap 429 thi NGHI 45 PHUT roi chay tiep, KHONG chay trong gio giao dich (T2-T6 08:00-15:45, de khong tranh quota voi engine), xao tron thu tu hang doi
// (du lieu dung duoc bat cu luc nao - la mau ngau nhien), chi lay ma thanh khoan cao (--gtgd=30 ty) va moi N ngay mot (--moi-ngay=2).
// CACH CHAY: node --env-file=.env.dnse.local engine/dich-vu/taiDongTienToanThiTruong.mjs [--gioi-han=N] [--toc-do=2.5] [--gtgd=30] [--moi-ngay=2]
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
const thamSo = (ten, macDinh) => Number(process.argv.find((x) => x.startsWith(`--${ten}=`))?.slice(ten.length + 3)) || macDinh;
const gioiHan = thamSo("gioi-han", Infinity);
const TOC_DO = thamSo("toc-do", 2.5); // goi / giay (toan cuc)
const NGUONG_GTGD = thamSo("gtgd", 30);
const MOI_NGAY = thamSo("moi-ngay", 2);
const md0 = taoMarketData({ apiKey: process.env.DNSE_API_KEY, apiSecret: process.env.DNSE_API_SECRET });
// moi goi REST di qua day: cho toi luot (toc do TOC_DO), cho het dot chan 429 / gio giao dich
let luotKe = 0, nghiDen = 0;
const ngu = (ms) => new Promise((r) => setTimeout(r, ms));
function trongGioGiaoDich() {
  const v = new Date(Date.now() + 7 * 3600e3);
  const thu = v.getUTCDay(), phut = v.getUTCHours() * 60 + v.getUTCMinutes();
  return thu >= 1 && thu <= 5 && phut >= 8 * 60 && phut < 15 * 60 + 45;
}
async function choPhep() {
  for (;;) {
    while (trongGioGiaoDich()) { if (!choPhep.da) { console.log("trong gio giao dich - tam nghi (tranh quota voi engine)"); choPhep.da = true; } await ngu(60_000); }
    choPhep.da = false;
    const bay = Date.now();
    if (bay < nghiDen) { await ngu(Math.min(30_000, nghiDen - bay)); continue; }
    const t = Math.max(bay, luotKe);
    luotKe = t + 1000 / TOC_DO;
    if (t > bay) await ngu(t - bay);
    return;
  }
}
const goi = async (fn) => {
  for (let lan = 0; ; lan++) {
    await choPhep();
    const r = await fn();
    if (r.status !== 429) return r;
    nghiDen = Date.now() + 45 * 60_000;
    console.log(`${new Date().toLocaleTimeString("vi-VN")} HTTP 429 - nghi 45 phut (da ${xongDem} cap)`);
  }
};
const md = {
  trades: (...a) => goi(() => md0.trades(...a)),
  nuocNgoai: (...a) => goi(() => md0.nuocNgoai(...a)),
};
let xongDem = 0;
const gio = (iso) => Math.floor(new Date(iso).getTime() / 1000);
const kho = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf-8")) : {};

async function layPhien(ma, ngay) {
  const tu = gio(`${ngay}T08:55:00+07:00`);
  let den = gio(`${ngay}T15:05:00+07:00`);
  const duy = new Map();
  let khong = 0;
  for (let goi = 0; den > tu && goi < 600; goi++) {
    const r = await md.trades(ma, tu, den, { limit: 1000 });
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

// hang doi: ma thanh khoan cao (GTGD TB20 >= NGUONG_GTGD ty o phien cuoi) x moi MOI_NGAY ngay mot, XAO TRON (mau ngau nhien - dung duoc bat cu luc nao)
const gtgdCuoi = (ma) => { const b = cache[ma]; let t = 0; for (const x of b.slice(-20)) t += (x.c * (x.v ?? 0)) / 1e6; return t / 20; };
const maTot = dsMa.filter((ma) => gtgdCuoi(ma) >= NGUONG_GTGD);
const ngayChon = ngayGd.filter((_, i) => i % MOI_NGAY === 0);
const hang = [];
for (const ngay of ngayChon) for (const ma of maTot) if (!(`${ma}|${ngay}` in kho) && cache[ma].some((x) => x.t === ngay)) hang.push([ma, ngay]);
for (let i = hang.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [hang[i], hang[j]] = [hang[j], hang[i]]; }
const tong = Math.min(hang.length, gioiHan);
hang.length = tong;
console.log(`${ngayChon.length}/${ngayGd.length} ngay (${ngayGd[0]} .. ${ngayGd[ngayGd.length - 1]}), ${maTot.length}/${dsMa.length} ma (GTGD TB20 >= ${NGUONG_GTGD} ty); da co ${Object.keys(kho).length} cap; can tai ${tong} cap; toc do ${TOC_DO} goi/giay`);
let xong = 0, loi = 0;
const t0 = Date.now();
const luu = () => writeFileSync(FILE, JSON.stringify(kho));
await Promise.all(Array.from({ length: 4 }, async () => {
  while (hang.length) {
    const [ma, ngay] = hang.shift();
    try {
      kho[`${ma}|${ngay}`] = await xuLy(ma, ngay);
    } catch (e) {
      loi++;
      if (loi <= 10) console.log("LOI", ma, ngay, e.message);
    }
    xongDem = ++xong;
    if (xong % 100 === 0) {
      luu();
      const giay = (Date.now() - t0) / 1000;
      console.log(`${xong}/${tong} (${loi} loi) ${Math.round(giay)}s, con ~${Math.round(((tong - xong) / xong) * giay / 60)} phut`);
    }
  }
}));
luu();
console.log(`XONG: ${Object.keys(kho).length} cap, ${loi} loi, ${Math.round((Date.now() - t0) / 60000)} phut`);
