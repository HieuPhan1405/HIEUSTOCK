// BACKTEST "KIJUN PHANG HUT XUONG" (khach san trong xu huong tang): gia dang TANG, nam TREN Kijun phang (>=5 phien
// khong doi), Tenkan di len -> gia co bi hut ve cham Kijun khong, va lai/lo cua nguoi dang giu ra sao. Doi chung: Kijun
// KHONG phang cung dieu kien. Doc cache engine/output/nen_backtest.json. Quy uoc giong backtestNamCham.mjs.
// CACH CHAY: node engine/dich-vu/backtestKijunHutXuong.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tinhIchimoku } from "../loi/ichimoku.js";
import { hhv, llv, sma } from "../loi/mang.js";

const cache = JSON.parse(readFileSync(fileURLToPath(new URL("../output/nen_backtest.json", import.meta.url)), "utf-8"));
const NS = [3, 5, 10];
const GTGD_TOI_THIEU_TY = 5;
const BAT_DAU = 80;

const duLieu = [];
for (const [ma, nen] of Object.entries(cache)) {
  const high = nen.map((b) => b.h), low = nen.map((b) => b.l), close = nen.map((b) => b.c), vol = nen.map((b) => b.v);
  const ich = tinhIchimoku({ high, low });
  const gtgd = sma(close.map((c, i) => (c * vol[i]) / 1e6), 20);
  const c5 = hhv(ich.kijun, 5), t5 = llv(ich.kijun, 5);
  const kPhang = ich.kijun.map((v, i) => v != null && c5[i] != null && t5[i] != null && c5[i] - t5[i] === 0);
  duLieu.push({ ma, nen, n: nen.length, high, low, close, ich, gtgd, kPhang });
}

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

const NHOM = {
  "Kijun PHANG, gia tren, dang tang": (d, i) => d.kPhang[i],
  "Kijun KHONG phang (doi chung)": (d, i) => !d.kPhang[i],
  "Khach san tang: Kijun PHANG + Tenkan doc len": (d, i) => d.kPhang[i] && d.ich.tenkan[i] > d.ich.tenkan[i - 3],
  "Kijun KHONG phang + Tenkan doc len (doi chung)": (d, i) => !d.kPhang[i] && d.ich.tenkan[i] > d.ich.tenkan[i - 3],
};

const suKien = [];
for (const d of duLieu)
  for (const [ten, ham] of Object.entries(NHOM)) {
    let luc = -100;
    for (let i = BAT_DAU; i < d.n - 10; i++) {
      if (i - luc < 5) continue;
      if (!(d.gtgd[i] >= GTGD_TOI_THIEU_TY) || d.high[i] === d.low[i]) continue;
      const kj = d.ich.kijun[i];
      if (!(kj > 0) || !(d.close[i] > d.close[i - 5])) continue; // dang tang
      const cach = (d.close[i] / kj - 1) * 100; // gia CAO hon Kijun bao nhieu %
      if (cach < 3 || cach >= 20) continue;
      if (!ham(d, i)) continue;
      const sk = { nhom: ten, cach, cham: [], ret: [], vuot: [] };
      NS.forEach((N, k) => {
        let thap = Infinity;
        for (let j = i + 1; j <= i + N; j++) thap = Math.min(thap, d.low[j]);
        sk.cham.push(thap <= kj);
        const r = (d.close[i + N] / d.close[i] - 1) * 100;
        const tb = tbNgay(k, d.nen[i].t);
        sk.ret.push(r);
        sk.vuot.push(tb == null ? null : r - tb * 100);
      });
      suKien.push(sk);
      luc = i;
    }
  }

const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (v, dp = 2) => (Number.isFinite(v) ? v.toFixed(dp) : "  -  ");
console.log("Gia CAO hon Kijun 3-20%, dang tang (cao hon 5 phien truoc). cham = gia thap nhat trong t+1..t+N <= Kijun.\n");
for (const ten of Object.keys(NHOM)) {
  const ds = suKien.filter((s) => s.nhom === ten);
  console.log(`[${ten}] n=${ds.length}`);
  NS.forEach((N, k) => console.log(`   T+${N}: cham ${f((ds.filter((s) => s.cham[k]).length / ds.length) * 100, 0)}% | lai gop TB ${f(tb(ds.map((s) => s.ret[k])))}% | vuot TT ${f(tb(ds.map((s) => s.vuot[k]).filter((v) => v != null)))}%`));
  const kc = [[3, 6], [6, 10], [10, 20]].map(([lo, hi]) => {
    const x = ds.filter((s) => s.cach >= lo && s.cach < hi);
    return `${lo}-${hi}%: n=${x.length} cham T+5 ${f((x.filter((s) => s.cham[1]).length / (x.length || 1)) * 100, 0)}%`;
  });
  console.log("   theo khoang cach: " + kc.join(" | ") + "\n");
}
