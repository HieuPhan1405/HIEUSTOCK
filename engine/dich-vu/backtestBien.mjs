// BACKTEST 2 HUONG (doc cache engine/output/nen_backtest.json + vnindex_backtest.json, khong dung mang):
//  A) SWING: xu huong tang + giam dan + cham Kijun tu tren, GIU 5/10/20 phien, them loc RS/diem/khoi luong can.
//  B) TRONG BIEN: ma dang di ngang (bien do 40 phien 8-25%), cham BIEN DUOI (day 40 phien truoc do) roi giu duoc,
//     kem "dong tien vao" + nen chu V, T+3/5/10 va mo phong SL/TP (SL duoi bien 1.5%, TP giua bien / bien tren).
// Quy uoc giong backtestKetHop.mjs: vao gia dong cua t, tru 0.4% phi+thue, "vuot TT" = tru TB thi truong cung ngay,
// moi ma toi da 1 su kien/5 phien/nhom, SL/TP chi bat dau tu t+2 (T+2.5), SL kiem truoc TP khi cung ngay.
// CACH CHAY: node engine/dich-vu/backtestBien.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tinhIchimoku, tinhDuongCanBangDaiHan } from "../loi/ichimoku.js";
import { rsi, mfi, adxHeThong } from "../loi/taChiBao.js";
import { tinhDiem } from "../loi/diem.js";
import { hhv, llv, sma } from "../loi/mang.js";

const doc = (ten) => JSON.parse(readFileSync(fileURLToPath(new URL("../output/" + ten, import.meta.url)), "utf-8"));
const cache = doc("nen_backtest.json");
const vniMap = new Map(doc("vnindex_backtest.json").map((b) => [b.t, b.c]));
const NS = [3, 5, 10, 20];
const CHI_PHI = 0.4;
const GTGD_TOI_THIEU_TY = 5;
const BAT_DAU = 260;
const NAM_OOS = "2025";

// ---------- 1. Chi bao ----------
const duLieu = [];
for (const [ma, nen] of Object.entries(cache)) {
  const n = nen.length;
  if (n < BAT_DAU + 30) continue;
  const high = nen.map((b) => b.h), low = nen.map((b) => b.l), close = nen.map((b) => b.c), open = nen.map((b) => b.o), vol = nen.map((b) => b.v);
  const ich = tinhIchimoku({ high, low });
  const cb = tinhDuongCanBangDaiHan({ high, low });
  const rsi14 = rsi({ close }, 14);
  const mfi14 = mfi({ high, low, close, volume: vol }, 14);
  const adx = adxHeThong({ high, low, close }, 14);
  const avgVol = sma(vol, 20);
  const relVol = vol.map((v, i) => (avgVol[i] > 0 ? v / avgVol[i] : null));
  const gtgd = sma(close.map((c, i) => (c * vol[i]) / 1e6), 20);
  const diem = tinhDiem({ close, cloudTop: ich.cloudTop, cloudBot: ich.cloudBot, cbTop: cb.cbTop, cbBot: cb.cbBot, tenkan: ich.tenkan, kijun: ich.kijun, adx: adx.adx, diPlus: adx.diPlus, diMinus: adx.diMinus, rsi: rsi14, mfi: mfi14, relVol }).totalScore;
  const vni = nen.map((b) => vniMap.get(b.t) ?? null);
  const rs20 = close.map((c, i) => (i >= 20 && vni[i] != null && vni[i - 20] != null ? (c / close[i - 20] - 1 - (vni[i] / vni[i - 20] - 1)) * 100 : null));
  const hh40 = hhv(high, 40), ll40 = llv(low, 40);
  const day52 = llv(low, 252), dinh52 = hhv(high, 252), dinh60 = hhv(high, 60), day60 = llv(low, 60);
  const ht = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    let hmax = -Infinity;
    for (const v of [day52[i], cb.cbBot[i], ich.cloudBot[i], day60[i]]) if (v != null && v < close[i] && v > hmax) hmax = v;
    ht[i] = hmax > -Infinity ? hmax : null;
  }
  duLieu.push({ ma, nen, n, high, low, close, open, vol, ich, cb, rsi14, mfi14, relVol, gtgd, diem, rs20, hh40, ll40, ht });
}

// ---------- 2. Trung binh thi truong ----------
const thiTruong = NS.map(() => new Map());
for (const d of duLieu)
  for (let i = BAT_DAU; i < d.n; i++) {
    if (!(d.gtgd[i] >= GTGD_TOI_THIEU_TY)) continue;
    NS.forEach((N, k) => {
      if (i + N >= d.n) return;
      const m = thiTruong[k].get(d.nen[i].t) ?? { tong: 0, dem: 0 };
      m.tong += d.close[i + N] / d.close[i] - 1;
      m.dem += 1;
      thiTruong[k].set(d.nen[i].t, m);
    });
  }
const tbNgay = (k, ngay) => {
  const m = thiTruong[k].get(ngay);
  return m && m.dem >= 30 ? m.tong / m.dem : null;
};

// ---------- 3. Dieu kien ----------
const xuHuongTang = (d, i) => d.cb.cbTop[i] != null && d.close[i] > d.cb.cbTop[i] && d.close[i] > d.ich.cloudTop[i];
const giamDan = (d, i) => d.close[i] < d.close[i - 5];
const chamKijunTuTren = (d, i) => d.low[i] <= d.ich.kijun[i] * 1.01 && d.close[i] >= d.ich.kijun[i];
const swing = (d, i) => xuHuongTang(d, i) && giamDan(d, i) && chamKijunTuTren(d, i);

const bienDo = (d, i) => (d.hh40[i - 1] != null && d.ll40[i - 1] > 0 ? d.hh40[i - 1] / d.ll40[i - 1] - 1 : null);
const chamBienDuoi = (d, i) => d.ll40[i - 1] != null && d.low[i] <= d.ll40[i - 1] * 1.01 && d.close[i] > d.ll40[i - 1];
const trongBien = (d, i) => {
  const w = bienDo(d, i);
  return w != null && w >= 0.08 && w <= 0.25;
};
const dongTienVao = (d, i) => d.close[i] > d.close[i - 1] && d.relVol[i] != null && d.relVol[i] > 1.2 && d.mfi14[i] != null && d.mfi14[i - 1] != null && d.mfi14[i] > d.mfi14[i - 1];
const nenV = (d, i) => (d.close[i - 3] - d.low[i]) / d.close[i - 3] >= 0.05 && d.high[i] > d.low[i] && (d.close[i] - d.low[i]) / (d.high[i] - d.low[i]) >= 0.6 && d.close[i] > d.open[i];
const chamHT = (d, i) => d.ht[i - 1] != null && d.low[i] <= d.ht[i - 1] * 1.01 && d.close[i] > d.ht[i - 1];
const va = (...fs) => (d, i) => fs.every((f) => f(d, i));

const NHOM_A = {
  "A0 swing: xu huong tang + giam dan + cham Kijun": swing,
  "A1 A0 + RS20 so VN-Index > 0": va(swing, (d, i) => d.rs20[i] != null && d.rs20[i] > 0),
  "A2 A0 + diem hop luu >= 1.25": va(swing, (d, i) => d.diem[i] != null && d.diem[i] >= 1.25),
  "A3 A0 + khoi luong can (<0.8x TB20)": va(swing, (d, i) => d.relVol[i] != null && d.relVol[i] < 0.8),
  "A4 A0 + RS>0 + khoi luong can": va(swing, (d, i) => d.rs20[i] != null && d.rs20[i] > 0, (d, i) => d.relVol[i] != null && d.relVol[i] < 0.8),
  "A5 A0 + nen xanh (dong>mo)": va(swing, (d, i) => d.close[i] > d.open[i]),
};
const NHOM_B = {
  "B0 (doi chung) cham day 40p nhung KHONG di ngang (bien do>25%)": va((d, i) => (bienDo(d, i) ?? 0) > 0.25, chamBienDuoi),
  "B1 trong bien + cham bien duoi (giu duoc)": va(trongBien, chamBienDuoi),
  "B2 B1 + dong tien vao": va(trongBien, chamBienDuoi, dongTienVao),
  "B3 B1 + nen V": va(trongBien, chamBienDuoi, nenV),
  "B4 B1 + dong tien vao + nen V": va(trongBien, chamBienDuoi, dongTienVao, nenV),
  "B5 B1 + RSI<35": va(trongBien, chamBienDuoi, (d, i) => d.rsi14[i] != null && d.rsi14[i] < 35),
  "B6 cham HT gan + dong tien vao + nen V (khong can bien)": va(chamHT, dongTienVao, nenV),
};

// ---------- 4. Su kien ----------
const suKien = [];
function taoSuKien(d, i, loai, ten) {
  const sk = { loai, nhom: ten, ma: d.ma, ngay: d.nen[i].t, nam: d.nen[i].t.slice(0, 4), ret: [], vuot: [], kq: null, kq2: null };
  NS.forEach((N, k) => {
    const r = (d.close[i + N] / d.close[i] - 1) * 100;
    const tb = tbNgay(k, sk.ngay);
    sk.ret.push(r);
    sk.vuot.push(tb == null ? null : r - tb * 100);
  });
  if (loai === "B") {
    const sl = d.ll40[i - 1] * 0.985;
    const mo = (tp) => {
      let gia = null;
      for (let j = i + 2; j <= i + 10 && gia == null; j++) {
        if (j === i + 2 && d.close[i + 1] <= sl) gia = d.open[j];
        else if (d.low[j] <= sl) gia = Math.min(d.open[j], sl);
        else if (d.high[j] >= tp) gia = Math.max(d.open[j], tp);
      }
      if (gia == null) gia = d.close[i + 10];
      return (gia / d.close[i] - 1) * 100;
    };
    const giua = (d.hh40[i - 1] + d.ll40[i - 1]) / 2;
    if (giua > d.close[i] * 1.01) sk.kq = mo(giua); // TP giua bien (chi khi giua bien cao hon gia >1%)
    const tren = d.hh40[i - 1] * 0.98;
    if (tren > d.close[i] * 1.02) sk.kq2 = mo(tren);
  }
  return sk;
}
for (const d of duLieu) {
  for (const [loai, nhom] of [["A", NHOM_A], ["B", NHOM_B]]) {
    for (const [ten, ham] of Object.entries(nhom)) {
      let luc = -100;
      for (let i = BAT_DAU; i < d.n - 20; i++) {
        if (i - luc < 5) continue;
        if (!(d.gtgd[i] >= GTGD_TOI_THIEU_TY) || d.high[i] === d.low[i]) continue;
        if (!ham(d, i)) continue;
        suKien.push(taoSuKien(d, i, loai, ten));
        luc = i;
      }
    }
  }
}

// ---------- 5. Thong ke ----------
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (v, dp = 2) => (Number.isFinite(v) ? v.toFixed(dp) : "  -  ");
const pad = (s, n) => String(s).padEnd(n);
{
  const r = NS.map(() => []);
  for (const d of duLieu) for (let i = BAT_DAU; i < d.n - 20; i += 5) if (d.gtgd[i] >= GTGD_TOI_THIEU_TY) NS.forEach((N, k) => r[k].push((d.close[i + N] / d.close[i] - 1) * 100 - CHI_PHI));
  console.log(`Du lieu: ${duLieu.length} ma, ${suKien.length} su kien. Doi chieu (mua ngau nhien moi 5 phien): lai rong TB ` + NS.map((N, k) => `T+${N} ${f(tb(r[k]))}%`).join(" | ") + "\n");
}
function inKetQua(loai, nhomObj, chinhK) {
  for (const ten of Object.keys(nhomObj)) {
    const ds = suKien.filter((s) => s.nhom === ten);
    if (!ds.length) {
      console.log(`${ten}: khong co su kien`);
      continue;
    }
    const nMa = new Set(ds.map((s) => s.ma)).size, nNgay = new Set(ds.map((s) => s.ngay)).size;
    const cot = NS.map((N, k) => `T+${N} ${f(tb(ds.map((s) => s.ret[k] - CHI_PHI)))} [${f(tb(ds.map((s) => s.vuot[k]).filter((v) => v != null)))}]`).join(" | ");
    const thang = (ds.filter((s) => s.ret[chinhK] - CHI_PHI > 0).length / ds.length) * 100;
    const oos = ds.filter((s) => s.nam >= NAM_OOS);
    let dong = `${pad(ten, 64)} n=${ds.length} (${nMa}/${nNgay}) | ${cot} | thang T+${NS[chinhK]} ${f(thang, 0)}% | 2025+ n=${oos.length} T+${NS[chinhK]} ${f(tb(oos.map((s) => s.ret[chinhK] - CHI_PHI)))} [${f(tb(oos.map((s) => s.vuot[chinhK]).filter((v) => v != null)))}]`;
    if (loai === "B") {
      const a = ds.filter((s) => s.kq != null), b = ds.filter((s) => s.kq2 != null);
      dong += ` | TPgiua n=${a.length} ${f(tb(a.map((s) => s.kq - CHI_PHI)))}% thang ${f((a.filter((s) => s.kq - CHI_PHI > 0).length / (a.length || 1)) * 100, 0)}% | TPtren n=${b.length} ${f(tb(b.map((s) => s.kq2 - CHI_PHI)))}% thang ${f((b.filter((s) => s.kq2 - CHI_PHI > 0).length / (b.length || 1)) * 100, 0)}%`;
    }
    console.log(dong);
  }
}
console.log("==== A) SWING: xu huong tang, dieu chinh ve Kijun, giu 5/10/20 phien (rong [vuot TT]) ====");
inKetQua("A", NHOM_A, 2);
console.log("\n==== B) TRONG BIEN: cham bien duoi (rong [vuot TT]; SL/TP toi da 10 phien) ====");
inKetQua("B", NHOM_B, 1);
