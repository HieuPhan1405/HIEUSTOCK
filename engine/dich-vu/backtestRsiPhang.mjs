// BACKTEST: RSI qua ban (<35) + duong PHANG nam TREN gia (Senkou B / Kijun / Tenkan) -> bao nhieu % giá tang sau N phien,
// bao nhieu % CHAM duoc muc duong phang do, phai tang bao nhieu % de toi do. Doi chung: cung dieu kien nhung duong KHONG phang.
// Doc cache engine/output/nen_backtest.json. Vao gia dong cua t, thoat dong cua t+N (N=2,3,5,10). Moi ma toi da 1 su kien/5 phien.
// CACH CHAY: node engine/dich-vu/backtestRsiPhang.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tinhIchimoku } from "../loi/ichimoku.js";
import { rsi } from "../loi/taChiBao.js";
import { hhv, llv, sma } from "../loi/mang.js";

const cache = JSON.parse(readFileSync(fileURLToPath(new URL("../output/nen_backtest.json", import.meta.url)), "utf-8"));
const NS = [2, 3, 5, 10];
const CHI_PHI = 0.4;
const GTGD_TOI_THIEU_TY = 5;
const BAT_DAU = 80;

const phang = (m, w) => {
  const c = hhv(m, w), t = llv(m, w);
  return m.map((v, i) => v != null && c[i] != null && t[i] != null && c[i] - t[i] === 0);
};

const duLieu = [];
for (const [ma, nen] of Object.entries(cache)) {
  const high = nen.map((b) => b.h), low = nen.map((b) => b.l), close = nen.map((b) => b.c), vol = nen.map((b) => b.v);
  const ich = tinhIchimoku({ high, low });
  const gtgd = sma(close.map((c, i) => (c * vol[i]) / 1e6), 20);
  duLieu.push({
    ma, nen, n: nen.length, high, low, close, ich, gtgd,
    rsi14: rsi({ close }, 14),
    pSB: phang(ich.senkouB, 5), pKJ: phang(ich.kijun, 5), pTK3: phang(ich.tenkan, 3), pTK5: phang(ich.tenkan, 5),
  });
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

// Moi nhom tra ve muc (level) nam TREN gia hoac null. "duong" = mang gia tri duong; "phangArr" = mang co phang.
const tren = (v, c) => (v != null && v > c ? v : null);
const NHOM = {
  "RSI<35, khong can duong (doi chung nen)": null,
  "RSI<35 + SenkouB PHANG tren gia": (d, i) => (d.pSB[i] ? tren(d.ich.senkouB[i], d.close[i]) : null),
  "   doi chung: SenkouB KHONG phang": (d, i) => (!d.pSB[i] ? tren(d.ich.senkouB[i], d.close[i]) : null),
  "RSI<35 + Kijun PHANG tren gia": (d, i) => (d.pKJ[i] ? tren(d.ich.kijun[i], d.close[i]) : null),
  "   doi chung: Kijun KHONG phang": (d, i) => (!d.pKJ[i] ? tren(d.ich.kijun[i], d.close[i]) : null),
  "RSI<35 + Tenkan PHANG 3 phien tren gia": (d, i) => (d.pTK3[i] ? tren(d.ich.tenkan[i], d.close[i]) : null),
  "   doi chung: Tenkan KHONG phang 3 phien": (d, i) => (!d.pTK3[i] ? tren(d.ich.tenkan[i], d.close[i]) : null),
  "RSI<35 + Tenkan PHANG 5 phien tren gia": (d, i) => (d.pTK5[i] ? tren(d.ich.tenkan[i], d.close[i]) : null),
  "RSI<35 + BAT KY duong phang (SB/Kijun/Tenkan3) tren gia": (d, i) => {
    let best = null;
    for (const [p, v] of [[d.pSB[i], d.ich.senkouB[i]], [d.pKJ[i], d.ich.kijun[i]], [d.pTK3[i], d.ich.tenkan[i]]]) {
      const l = p ? tren(v, d.close[i]) : null;
      if (l != null && (best == null || l < best)) best = l; // muc GAN gia nhat
    }
    return best;
  },
};

const suKien = [];
for (const d of duLieu)
  for (const [ten, ham] of Object.entries(NHOM)) {
    let luc = -100;
    for (let i = BAT_DAU; i < d.n - 10; i++) {
      if (i - luc < 5) continue;
      if (!(d.gtgd[i] >= GTGD_TOI_THIEU_TY) || d.high[i] === d.low[i]) continue;
      if (!(d.rsi14[i] != null && d.rsi14[i] < 35)) continue;
      let level = null, cach = null;
      if (ham) {
        level = ham(d, i);
        if (level == null) continue;
        cach = (level / d.close[i] - 1) * 100;
        if (cach < 3 || cach >= 20) continue;
      }
      const sk = { nhom: ten, ma: d.ma, cach, up: [], cham: [], ret: [], vuot: [] };
      NS.forEach((N, k) => {
        let cao = -Infinity;
        for (let j = i + 1; j <= i + N; j++) cao = Math.max(cao, d.high[j]);
        const r = (d.close[i + N] / d.close[i] - 1) * 100;
        const tb = tbNgay(k, d.nen[i].t);
        sk.up.push(r > 0);
        sk.cham.push(level != null ? cao >= level : null);
        sk.ret.push(r);
        sk.vuot.push(tb == null ? null : r - tb * 100);
      });
      suKien.push(sk);
      luc = i;
    }
  }

const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const md = (a) => {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const f = (v, dp = 0) => (Number.isFinite(v) ? v.toFixed(dp) : "-");
const pct = (a) => (a.length ? (a.filter(Boolean).length / a.length) * 100 : NaN);

// Doi chieu khong dieu kien: ty le gia tang sau N phien o MOI bar thanh khoan.
{
  const up = NS.map(() => []);
  for (const d of duLieu) for (let i = BAT_DAU; i < d.n - 10; i += 5) if (d.gtgd[i] >= GTGD_TOI_THIEU_TY) NS.forEach((N, k) => up[k].push(d.close[i + N] > d.close[i]));
  console.log("Doi chieu KHONG dieu kien (mua bat ky luc nao): % gia tang sau " + NS.map((N, k) => `T+${N} ${f(pct(up[k]))}%`).join(" | ") + "\n");
}
for (const ten of Object.keys(NHOM)) {
  const ds = suKien.filter((s) => s.nhom === ten);
  const nMa = new Set(ds.map((s) => s.ma)).size;
  const khoangCach = ds[0]?.cach != null ? ` | phai tang TB ${f(tb(ds.map((s) => s.cach)), 1)}% (trung vi ${f(md(ds.map((s) => s.cach)), 1)}%) de toi muc` : "";
  console.log(`[${ten.trim()}] n=${ds.length} (${nMa} ma)${khoangCach}`);
  NS.forEach((N, k) => {
    const cham = ds[0]?.cach != null ? ` | CHAM muc ${f(pct(ds.map((s) => s.cham[k])))}%` : "";
    console.log(`   T+${N}: gia TANG ${f(pct(ds.map((s) => s.up[k])))}% | lai gop TB ${f(tb(ds.map((s) => s.ret[k])), 2)}% (trung vi ${f(md(ds.map((s) => s.ret[k])), 2)}%) | vuot TT ${f(tb(ds.map((s) => s.vuot[k]).filter((v) => v != null)), 2)}%${cham}`);
  });
  if (ds[0]?.cach != null) {
    const kc = [[3, 6], [6, 10], [10, 20]].map(([lo, hi]) => {
      const x = ds.filter((s) => s.cach >= lo && s.cach < hi);
      return `cach ${lo}-${hi}%: n=${x.length} tang T+5 ${f(pct(x.map((s) => s.up[2])))}% cham T+5 ${f(pct(x.map((s) => s.cham[2])))}%`;
    });
    console.log("   " + kc.join(" | "));
  }
  console.log();
}
