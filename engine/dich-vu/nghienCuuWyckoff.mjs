// WYCKOFF: XAC DINH PHA CO PHIEU (tich luy / tang gia / phan phoi / giam gia) CO GIUP LOC LENH TOT HON KHONG? (Hieu 2026-10-24).
// Wyckoff goc la doc bieu do bang mat nen khong co cong thuc chinh thuc - day la BAN LUAT HOA (xap xi), tai nen xet i, chi dung du lieu den het nen i:
//  - Khung gia 60 nen: H60 / L60, biên do = H60/L60 - 1, vi tri gia trong khung; xu huong: SMA50 doc 20 nen, gia so voi SMA50 / SMA200;
//  - boi canh: SUT truoc khung (dinh 200..60 nen truoc -> L60 giam >= 25%) hoac TANG truoc khung (L60 so voi day 200..60 nen truoc tang >= 25%);
//  - khoi luong: tong KL cac phien DONG CUA TANG / tong KL phien DONG CUA GIAM trong 40 nen (>= 1 = ben mua chiem uu the).
//  PHA: TANG GIA (markup) = dong cua > SMA50 > SMA200 va SMA50 doc len >= 2% | GIAM GIA (markdown) = dong cua < SMA50 < SMA200 va SMA50 doc xuong >= 2%
//       | TICH LUY = khung hep (<= 35%), boi canh la SUT, day khung khong bi pha trong 15 nen gan nhat, ben mua >= 1 | PHAN PHOI = khung hep (<= 35%), boi canh la TANG, gia o nua duoi khung, ben mua < 1 | con lai: CHUYEN TIEP.
//  SU KIEN (trong 10 nen gan nhat): SPRING = gia thung day khung truoc do roi dong cua tro lai tren day trong <= 3 nen; SOS = dong cua vuot dinh khung kem KL >= 1,5x TB20.
// Do tren (1) lenh MUA thuong cua he thong (2014-2026, vao MO CUA phien ke tiep, cat lo engine, ban tu T+3, phi 0,4%) va (2) diem B (giam 20-30%, mua mo cua phien ke tiep, khong cat lo, lai 10 / 20 phien tru phi 0,4%).
// Truoc 2022-05 / tu 2022-05. CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuWyckoff.mjs
import { docJson, chayEngine, moPhongThucTe } from "./backtestChung.mjs";
import { atr as atrFn } from "../loi/taChiBao.js";
import { tinhIchimoku, tinhDuongCanBangDaiHan } from "../loi/ichimoku.js";
import { tinhDiemMuaPhucHoi } from "../loi/diemMuaPhucHoi.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const CP = 0.4;

function sma(a, n) {
  const kq = new Array(a.length).fill(null);
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    s += a[i];
    if (i >= n) s -= a[i - n];
    if (i >= n - 1) kq[i] = s / n;
  }
  return kq;
}
const mu = new Map();
function chuoi(ma) {
  if (!mu.has(ma)) {
    const nen = cache[ma];
    const close = nen.map((x) => x.c);
    mu.set(ma, { close, high: nen.map((x) => x.h), low: nen.map((x) => x.l), vol: nen.map((x) => x.v ?? 0), s50: sma(close, 50), s200: sma(close, 200) });
  }
  return mu.get(ma);
}

// Tra ve { pha, spring, sos } tai nen i, hoac null neu chua du du lieu.
function phaWyckoff(d, i) {
  const { close, high, low, vol, s50, s200 } = d;
  if (i < 260 || s200[i] == null || s50[i - 20] == null) return null;
  let H = -Infinity, L = Infinity, iL = i;
  for (let j = i - 59; j <= i; j++) { if (high[j] > H) H = high[j]; if (low[j] < L) { L = low[j]; iL = j; } }
  const bienDo = H / L - 1, viTri = H > L ? (close[i] - L) / (H - L) : 0.5;
  let Hcu = -Infinity, Lcu = Infinity;
  for (let j = i - 200; j < i - 59; j++) { if (high[j] > Hcu) Hcu = high[j]; if (low[j] < Lcu) Lcu = low[j]; }
  const sut = 1 - L / Hcu, tang = H / Lcu - 1;
  let len = 0, xuong = 0;
  for (let j = i - 39; j <= i; j++) { if (close[j] >= close[j - 1]) len += vol[j] * close[j]; else xuong += vol[j] * close[j]; }
  const benMua = xuong > 0 ? len / xuong : 2;
  const doc50 = s50[i] / s50[i - 20] - 1;
  let pha = "CHUYEN TIEP";
  if (close[i] > s50[i] && s50[i] > s200[i] && doc50 >= 0.02) pha = "TANG GIA";
  else if (close[i] < s50[i] && s50[i] < s200[i] && doc50 <= -0.02) pha = "GIAM GIA";
  else if (bienDo <= 0.35 && sut >= 0.25 && i - iL >= 15 && benMua >= 1) pha = "TICH LUY";
  else if (bienDo <= 0.35 && tang >= 0.25 && viTri < 0.5 && benMua < 1) pha = "PHAN PHOI";
  // su kien: so voi khung TRUOC 10 nen
  let Hk = -Infinity, Lk = Infinity;
  for (let j = i - 69; j <= i - 10; j++) { if (high[j] > Hk) Hk = high[j]; if (low[j] < Lk) Lk = low[j]; }
  let spring = false, sos = false;
  for (let j = i - 9; j <= i; j++) {
    if (low[j] < Lk) for (let k = j; k <= Math.min(i, j + 3); k++) if (close[k] > Lk) { spring = true; break; }
    let tbv = 0; for (let k = j - 20; k < j; k++) tbv += vol[k]; tbv /= 20;
    if (close[j] > Hk && close[j - 1] <= Hk && vol[j] >= 1.5 * tbv) sos = true;
  }
  return { pha, spring, sos };
}

const PHA = ["TICH LUY", "TANG GIA", "PHAN PHOI", "GIAM GIA", "CHUYEN TIEP"];
function bang(ten, a, cot) {
  for (const [tk, loc] of [["TRUOC 2022-05", (x) => x.ky === 0], ["TU 2022-05", (x) => x.ky === 1]]) {
    const d = a.filter(loc);
    console.log(`\n######## ${ten} | ${tk}: ${d.length} lenh | TB chung ${cot.map((c) => `${c} ${f(tb(d.map((x) => x[c]).filter(Number.isFinite)))}`).join(" | ")} ########`);
    const dong = (tn, g) => {
      if (g.length < 25) { console.log(`   ${tn.padEnd(24)} n=${String(g.length).padStart(4)} (it mau)`); return; }
      console.log(`   ${tn.padEnd(24)} n=${String(g.length).padStart(4)} | ${cot.map((c) => { const r = g.map((x) => x[c]).filter(Number.isFinite); return `${c} ${f(tb(r)).padStart(6)} [thang ${f((r.filter((v) => v > 0).length / r.length) * 100, 0)}%]`; }).join(" | ")}`);
    };
    for (const p of PHA) dong(`pha ${p}`, d.filter((x) => x.pha === p));
    dong("co SPRING (10 nen)", d.filter((x) => x.spring));
    dong("co SOS (10 nen)", d.filter((x) => x.sos));
    dong("TICH LUY + (SPRING|SOS)", d.filter((x) => x.pha === "TICH LUY" && (x.spring || x.sos)));
    dong("KHONG o pha GIAM/PHAN PHOI", d.filter((x) => x.pha !== "GIAM GIA" && x.pha !== "PHAN PHOI"));
  }
}

// ---------- (1) lenh MUA thuong ----------
const { lenh } = chayEngine({ cache, vni });
const mua = [];
const demPha = {};
for (const t of lenh) {
  if (t.loai !== 1 || t.iv < 260 || t.iv + 5 >= t.n) continue;
  const E = t.open[t.iv + 1];
  if (!(E > 0) || !(E > t.S)) continue;
  const ret = moPhongThucTe(t, { E, vao: t.iv + 1, banTu: t.iv + 3 });
  if (ret == null || !Number.isFinite(ret)) continue;
  const w = phaWyckoff(chuoi(t.ma), t.iv);
  if (!w) continue;
  demPha[w.pha] = (demPha[w.pha] ?? 0) + 1;
  mua.push({ ky: t.ngay < "2022-05-01" ? 0 : 1, ret, ...w });
}
console.log(`${mua.length} lenh MUA thuong; phan bo pha:`, JSON.stringify(demPha));
bang("LENH MUA THUONG", mua, ["ret"]);

// ---------- (2) diem B ----------
const dB = [];
for (const [ma, b0] of Object.entries(cache)) {
  const b = b0.length > 1500 ? b0.slice(-1500) : b0;
  if (b.length < 400) continue;
  const n = b.length, high = b.map((x) => x.h), low = b.map((x) => x.l), close = b.map((x) => x.c), volume = b.map((x) => x.v), open = b.map((x) => x.o);
  const ich = tinhIchimoku({ high, low }), cb = tinhDuongCanBangDaiHan({ high, low }), a = atrFn({ high, low, close }, 14);
  const { laB } = tinhDiemMuaPhucHoi({ high, low, close, volume, atr: a, tenkan: ich.tenkan, kijun: ich.kijun, cloudTop: ich.cloudTop, cbTop: cb.cbTop }, { giamTuPct: 20, giamDenPct: 30 });
  const d = { close, high, low, vol: volume.map((v) => v ?? 0), s50: sma(close, 50), s200: sma(close, 200) };
  for (let i = 260; i < n - 21; i++) {
    if (!laB[i]) continue;
    const E = open[i + 1];
    if (!(E > 0)) continue;
    const w = phaWyckoff(d, i);
    if (!w) continue;
    dB.push({ ky: b[i].t < "2022-05-01" ? 0 : 1, r10: (close[i + 10] / E - 1) * 100 - CP, r20: (close[i + 20] / E - 1) * 100 - CP, ...w });
  }
}
console.log(`\n\n${dB.length} diem B (giam 20-30%)`);
bang("DIEM B (giam 20-30%)", dB, ["r10", "r20"]);
