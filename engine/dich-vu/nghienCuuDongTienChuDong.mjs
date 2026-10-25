// DONG TIEN CHU DONG (DNSE) CO LOC LENH MUA / DIEM B TOT HON KHONG? (Hieu 2026-10-26: "test xem dong tien chu dong co loc lenh tot hon khong").
// DNSE chi giu lich su tung lenh khop ~6,5 thang (tu ~2026-04) nen backtest chi tren GIAI DOAN NGAN. Cach lam: voi moi tin hieu (lenh MUA thuong cua engine, diem B giam 20-30%) tu 2026-04-01, keo tick CUA DUNG NGAY TIN HIEU
// (thong tin co duoc luc dong cua), gom bang BoGopDongTien, roi so lai sau (mo cua phien ke tiep, tru phi 0,4%) theo dac trung dong tien:
//   imb = (mua - ban) / (mua + ban) chu dong | lon = (lenh lon mua - ban) / (mua + ban) | nn = khoi ngoai rong (ty) / (mua + ban) | tyLeLon = lenh lon / tong chu dong.
// Chia: dau (>0) / am (<0) va TAM PHAN VI (tertile) - trong tung nhom bao cao so lenh, lai TB, ty le thang; chenh lech nhom cao - nhom thap + thong ke t.
// Ket qua tick duoc luu cache o engine/output/dong_tien_tin_hieu.json (chay lai khong tai lai). CHI DOC. CACH CHAY: node --env-file=.env.dnse.local engine/dich-vu/nghienCuuDongTienChuDong.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { docJson, chayEngine, moPhongThucTe } from "./backtestChung.mjs";
import { atr as atrFn } from "../loi/taChiBao.js";
import { tinhIchimoku, tinhDuongCanBangDaiHan } from "../loi/ichimoku.js";
import { tinhDiemMuaPhucHoi } from "../loi/diemMuaPhucHoi.js";
import { taoMarketData } from "../dnse/marketDataRest.js";
import { BoGopDongTien, phanTichThoiGian } from "../loi/dongTienChuDong.js";

const TU = "2026-04-01";
const CP = 0.4;
const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const sd = (a) => { const m = tb(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "-");

// ---------- 1) tin hieu ----------
const sk = []; // { loai, ma, ngay, ret?, r5, r10 }
const { lenh } = chayEngine({ cache, vni });
for (const t of lenh) {
  if (t.loai !== 1 || t.ngay < TU || t.iv + 11 >= t.n) continue;
  const E = t.open[t.iv + 1];
  if (!(E > 0) || !(E > t.S)) continue;
  const ret = moPhongThucTe(t, { E, vao: t.iv + 1, banTu: t.iv + 3 });
  sk.push({ loai: "MUA", ma: t.ma, ngay: t.ngay, ret, r5: (t.close[t.iv + 6] / E - 1) * 100 - CP, r10: (t.close[t.iv + 11] / E - 1) * 100 - CP });
}
for (const [ma, b] of Object.entries(cache)) {
  if (b.length < 300) continue;
  const n = b.length, high = b.map((x) => x.h), low = b.map((x) => x.l), close = b.map((x) => x.c), volume = b.map((x) => x.v), open = b.map((x) => x.o);
  const ich = tinhIchimoku({ high, low }), cb = tinhDuongCanBangDaiHan({ high, low }), a = atrFn({ high, low, close }, 14);
  const { laB } = tinhDiemMuaPhucHoi({ high, low, close, volume, atr: a, tenkan: ich.tenkan, kijun: ich.kijun, cloudTop: ich.cloudTop, cbTop: cb.cbTop }, { giamTuPct: 20, giamDenPct: 30 });
  for (let i = 260; i < n - 11; i++) {
    if (!laB[i] || b[i].t < TU || !(open[i + 1] > 0)) continue;
    const E = open[i + 1];
    sk.push({ loai: "B", ma, ngay: b[i].t, r5: (close[i + 6] / E - 1) * 100 - CP, r10: (close[i + 11] / E - 1) * 100 - CP });
  }
}
const cap = [...new Set(sk.map((x) => `${x.ma}|${x.ngay}`))];
console.log(`${sk.filter((x) => x.loai === "MUA").length} lenh MUA, ${sk.filter((x) => x.loai === "B").length} diem B tu ${TU}; ${cap.length} cap (ma, ngay) can keo tick`);

// ---------- 2) keo tick + khoi ngoai (co cache) ----------
const FILE = fileURLToPath(new URL("../output/dong_tien_tin_hieu.json", import.meta.url));
const kho = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf-8")) : {};
const md = taoMarketData({ apiKey: process.env.DNSE_API_KEY, apiSecret: process.env.DNSE_API_SECRET });
const gio = (iso) => Math.floor(new Date(iso).getTime() / 1000);
async function layPhien(ma, ngay) {
  const tu = gio(`${ngay}T08:55:00+07:00`);
  let den = gio(`${ngay}T15:05:00+07:00`);
  const duy = new Map();
  let khong = 0;
  for (let goi = 0; den > tu && goi < 400; goi++) {
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
async function xuLy(khoa) {
  const [ma, ngay] = khoa.split("|");
  const ds = await layPhien(ma, ngay);
  if (!ds.length) return { rong: true };
  const bo = new BoGopDongTien();
  for (const x of ds) bo.nhanTick(x);
  const t = bo.chupAnh().ma[ma];
  const fr = await md.nuocNgoai(ma, gio(`${ngay}T08:55:00+07:00`), gio(`${ngay}T15:05:00+07:00`), { limit: 1 });
  const nn = fr.json?.foreigners?.[0];
  return { mua: t?.mua ?? 0, ban: t?.ban ?? 0, lonMua: t?.lon.mua ?? 0, lonBan: t?.lon.ban ?? 0, nnRong: nn ? (nn.totalBuyTradedAmount - nn.totalSellTradedAmount) / 1e6 : null, soTick: ds.length };
}
const hang = cap.filter((k) => !(k in kho));
console.log(`can keo moi: ${hang.length} cap (da co cache ${cap.length - hang.length})`);
let xong = 0, loi = 0;
const t0 = Date.now();
await Promise.all(Array.from({ length: 4 }, async () => {
  while (hang.length) {
    const k = hang.shift();
    try {
      kho[k] = await xuLy(k);
    } catch (e) {
      loi++;
      if (loi < 6) console.log("LOI", k, e.message);
    }
    if (++xong % 50 === 0) {
      writeFileSync(FILE, JSON.stringify(kho));
      console.log(`${xong} xong, ${loi} loi, ${Math.round((Date.now() - t0) / 1000)}s`);
    }
  }
}));
writeFileSync(FILE, JSON.stringify(kho));

// ---------- 3) phan tich ----------
for (const x of sk) {
  const d = kho[`${x.ma}|${x.ngay}`];
  if (!d || d.rong || !(d.mua + d.ban > 0)) continue;
  const tong = d.mua + d.ban;
  x.imb = (d.mua - d.ban) / tong;
  x.lon = (d.lonMua - d.lonBan) / tong;
  x.tyLeLon = (d.lonMua + d.lonBan) / tong;
  x.nn = d.nnRong == null ? null : d.nnRong / tong;
  x.tong = tong;
}
const co = sk.filter((x) => x.imb != null);
console.log(`\ncon lai ${co.length}/${sk.length} tin hieu co du lieu dong tien`);
const DAC_TRUNG = [["imb", "can bang mua-ban chu dong"], ["lon", "lenh lon ron / tong"], ["nn", "khoi ngoai ron / tong"], ["tyLeLon", "ty le lenh lon"]];
const COT = [["r5", "5p"], ["r10", "10p"]];
function dong(ten, g) {
  if (g.length < 8) return console.log(`   ${ten.padEnd(26)} n=${String(g.length).padStart(3)} (it mau)`);
  console.log(`   ${ten.padEnd(26)} n=${String(g.length).padStart(3)} | ${COT.map(([c, n]) => { const v = g.map((x) => x[c]).filter(Number.isFinite); return `${n} ${f(tb(v)).padStart(6)} [thang ${f((v.filter((y) => y > 0).length / v.length) * 100, 0)}%]`; }).join(" | ")}${g[0].ret !== undefined ? ` | he thong ${f(tb(g.map((x) => x.ret).filter(Number.isFinite)))}` : ""}`);
}
function chenh(ten, cao, thap) {
  const out = COT.map(([c, n]) => {
    const a = cao.map((x) => x[c]).filter(Number.isFinite), b = thap.map((x) => x[c]).filter(Number.isFinite);
    if (a.length < 8 || b.length < 8) return `${n} -`;
    const d = tb(a) - tb(b), se = Math.sqrt(sd(a) ** 2 / a.length + sd(b) ** 2 / b.length);
    return `${n} ${f(d)} (t ${f(d / se, 1)})`;
  });
  console.log(`   >> chenh ${ten}: ${out.join(" | ")}`);
}
for (const loai of ["MUA", "B"]) {
  const g0 = co.filter((x) => x.loai === loai);
  console.log(`\n######## ${loai}: ${g0.length} tin hieu co dong tien ########`);
  dong("TAT CA", g0);
  for (const [k, ten] of DAC_TRUNG) {
    const g = g0.filter((x) => x[k] != null).sort((a, b) => a[k] - b[k]);
    if (g.length < 30) continue;
    console.log(` -- ${ten} (${k})`);
    const m = Math.floor(g.length / 3);
    const thap = g.slice(0, m), giua = g.slice(m, g.length - m), cao = g.slice(g.length - m);
    dong(`thap (<= ${f(thap[thap.length - 1][k], 2)})`, thap);
    dong("giua", giua);
    dong(`cao (>= ${f(cao[0][k], 2)})`, cao);
    chenh("cao - thap", cao, thap);
    if (k !== "tyLeLon") {
      dong(`${k} > 0`, g.filter((x) => x[k] > 0));
      dong(`${k} <= 0`, g.filter((x) => x[k] <= 0));
    }
  }
}
