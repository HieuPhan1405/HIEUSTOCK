// BACKTEST KET HOP: RSI + cham ho tro (HT gan) + khoang trong toi khang cu (KC gan) + duong phang, danh T+.
// Dinh nghia HT gan / KC gan GIONG HET amibroker/7_Export_LenWeb.afl (dong 1051-1108): KC gan = nho nhat trong
// {dinh 52 tuan, can bang dai han tren, may tren, dinh 60 phien} nam TREN gia; HT gan = lon nhat trong {day 52 tuan,
// can bang dai han duoi, may duoi, day 60 phien} nam DUOI gia.
// Quy uoc giong backtestNamCham.mjs: vao gia dong cua t, thoat T+N (N=2,3,5), tru 0.4% phi+thue, "vuot TT" = tru
// trung binh thi truong cung ngay, moi ma toi da 1 su kien/5 phien/nhom. Them: mo phong SL/TP (SL duoi HT 1%, TP =
// KC gan) chi bat dau tu t+2 (T+2.5), SL kiem truoc TP khi cung ngay (bao thu).
// CACH CHAY: node engine/dich-vu/backtestKetHop.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tinhIchimoku, tinhDuongCanBangDaiHan } from "../loi/ichimoku.js";
import { rsi } from "../loi/taChiBao.js";
import { hhv, llv, sma } from "../loi/mang.js";

const cache = JSON.parse(readFileSync(fileURLToPath(new URL("../output/nen_backtest.json", import.meta.url)), "utf-8"));
const NS = [2, 3, 5];
const CHI_PHI = 0.4;
const GTGD_TOI_THIEU_TY = 5;
const BAT_DAU = 260; // can du 252 phien cho dinh/day 52 tuan (giong AFL)
const NAM_OOS = "2025"; // tu nam nay tro di = "ngoai mau" de kiem tra on dinh

// ---------- 1. Chi bao ----------
const duLieu = [];
for (const [ma, nen] of Object.entries(cache)) {
  const n = nen.length;
  if (n < BAT_DAU + 20) continue;
  const high = nen.map((b) => b.h), low = nen.map((b) => b.l), close = nen.map((b) => b.c), open = nen.map((b) => b.o), vol = nen.map((b) => b.v);
  const ich = tinhIchimoku({ high, low });
  const cb = tinhDuongCanBangDaiHan({ high, low });
  const rsi14 = rsi({ close }, 14);
  const gtgd = sma(close.map((c, i) => (c * vol[i]) / 1e6), 20);
  const dinh52 = hhv(high, 252), day52 = llv(low, 252), dinh60 = hhv(high, 60), day60 = llv(low, 60);
  const phang = (m) => {
    const c = hhv(m, 5), t = llv(m, 5);
    return m.map((v, i) => v != null && c[i] != null && t[i] != null && c[i] - t[i] === 0);
  };
  const kPhang = phang(ich.kijun), sbPhang = phang(ich.senkouB);
  const kc = new Array(n).fill(null), ht = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    const c = close[i];
    let kmin = Infinity, hmax = -Infinity;
    for (const v of [dinh52[i], cb.cbTop[i], ich.cloudTop[i], dinh60[i]]) if (v != null && v > c && v < kmin) kmin = v;
    for (const v of [day52[i], cb.cbBot[i], ich.cloudBot[i], day60[i]]) if (v != null && v < c && v > hmax) hmax = v;
    kc[i] = kmin < Infinity ? kmin : null;
    ht[i] = hmax > -Infinity ? hmax : null;
  }
  duLieu.push({ ma, nen, n, high, low, close, open, vol, ich, cb, rsi14, gtgd, kPhang, sbPhang, kc, ht });
}

// ---------- 2. Trung binh thi truong theo ngay ----------
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

// ---------- 3. Dieu kien don ----------
const C = {
  rsiThap: (d, i) => d.rsi14[i] != null && d.rsi14[i] < 35,
  gan_HT: (d, i) => d.ht[i] != null && (d.close[i] - d.ht[i]) / d.close[i] <= 0.02,
  cham_HT: (d, i) => {
    const h = d.ht[i - 1];
    return h != null && d.low[i] <= h * 1.01 && d.close[i] > h;
  },
  conKC5: (d, i) => d.kc[i] != null && d.kc[i] / d.close[i] - 1 >= 0.05,
  RR2: (d, i) => d.kc[i] != null && d.ht[i] != null && (d.close[i] - d.ht[i]) / d.close[i] <= 0.06 && (d.kc[i] - d.close[i]) / (d.close[i] - d.ht[i]) >= 2,
  xanh: (d, i) => d.close[i] > d.open[i] && d.close[i] > d.close[i - 1],
  giamDan: (d, i) => d.close[i] < d.close[i - 5],
  xuHuongTang: (d, i) => d.cb.cbTop[i] != null && d.close[i] > d.cb.cbTop[i] && d.close[i] > d.ich.cloudTop[i],
  chamKijunTuTren: (d, i) => d.low[i] <= d.ich.kijun[i] * 1.01 && d.close[i] >= d.ich.kijun[i],
  chamSBTuTren: (d, i) => d.ich.senkouB[i] != null && d.low[i] <= d.ich.senkouB[i] * 1.01 && d.close[i] >= d.ich.senkouB[i],
};
const va = (...fs) => (d, i) => fs.every((f) => f(d, i));
const NHOM = {
  "1. RSI<35 (don le)": C.rsiThap,
  "2. Gan HT (<=2% tren HT gan) (don le)": C.gan_HT,
  "3. Cham HT roi giu duoc (don le)": C.cham_HT,
  "4. RSI<35 + gan HT": va(C.rsiThap, C.gan_HT),
  "5. RSI<35 + gan HT + con >=5% toi KC": va(C.rsiThap, C.gan_HT, C.conKC5),
  "6. RSI<35 + gan HT + RR>=2": va(C.rsiThap, C.gan_HT, C.RR2),
  "7. #6 + nen xanh bat len": va(C.rsiThap, C.gan_HT, C.RR2, C.xanh),
  "8. Gan HT + RR>=2 (KHONG can RSI)": va(C.gan_HT, C.RR2),
  "9. Cham HT giu duoc + RR>=2 + nen xanh": va(C.cham_HT, C.RR2, C.xanh),
  "10. Xu huong tang + giam dan + gan HT + RR>=2": va(C.xuHuongTang, C.giamDan, C.gan_HT, C.RR2),
  "11. Xu huong tang + giam dan + cham Kijun PHANG tu tren": va(C.xuHuongTang, C.giamDan, (d, i) => d.kPhang[i], C.chamKijunTuTren),
  "11c. (doi chung) ... Kijun KHONG phang": va(C.xuHuongTang, C.giamDan, (d, i) => !d.kPhang[i], C.chamKijunTuTren),
  "12. Xu huong tang + giam dan + cham SenkouB PHANG tu tren": va(C.xuHuongTang, C.giamDan, (d, i) => d.sbPhang[i], C.chamSBTuTren),
  "12c. (doi chung) ... SenkouB KHONG phang": va(C.xuHuongTang, C.giamDan, (d, i) => !d.sbPhang[i], C.chamSBTuTren),
};

// ---------- 4. Sinh su kien ----------
const suKien = [];
for (const d of duLieu) {
  for (const [ten, ham] of Object.entries(NHOM)) {
    let luc = -100;
    for (let i = BAT_DAU; i < d.n - 5; i++) {
      if (i - luc < 5) continue;
      if (!(d.gtgd[i] >= GTGD_TOI_THIEU_TY) || d.high[i] === d.low[i]) continue;
      if (!ham(d, i)) continue;
      const sk = { nhom: ten, ma: d.ma, ngay: d.nen[i].t, nam: d.nen[i].t.slice(0, 4), ret: [], vuot: [], chamKC: false, kq: null };
      NS.forEach((N, k) => {
        const r = (d.close[i + N] / d.close[i] - 1) * 100;
        const tbTT = tbNgay(k, sk.ngay);
        sk.ret.push(r);
        sk.vuot.push(tbTT == null ? null : r - tbTT * 100);
      });
      if (d.kc[i] != null) {
        let cao = -Infinity;
        for (let j = i + 1; j <= i + 5; j++) cao = Math.max(cao, d.high[j]);
        sk.chamKC = cao >= d.kc[i];
      }
      // Mo phong SL/TP: chi khi co ca HT (SL) va KC (TP) hop ly.
      if (d.ht[i] != null && d.kc[i] != null && (d.close[i] - d.ht[i]) / d.close[i] <= 0.08) {
        const sl = d.ht[i] * 0.99, tp = d.kc[i];
        let gia = null;
        for (let j = i + 2; j <= i + 5 && gia == null; j++) {
          if (j === i + 2 && d.close[i + 1] <= sl) gia = d.open[j];
          else if (d.low[j] <= sl) gia = Math.min(d.open[j], sl);
          else if (d.high[j] >= tp) gia = Math.max(d.open[j], tp);
        }
        if (gia == null) gia = d.close[i + 5];
        sk.kq = (gia / d.close[i] - 1) * 100;
      }
      suKien.push(sk);
      luc = i;
    }
  }
}

// ---------- 5. Thong ke ----------
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (v, dp = 2) => (Number.isFinite(v) ? v.toFixed(dp) : "  -  ");
const pad = (s, n) => String(s).padEnd(n);

{
  const r = NS.map(() => []);
  for (const d of duLieu) for (let i = BAT_DAU; i < d.n - 5; i += 5) if (d.gtgd[i] >= GTGD_TOI_THIEU_TY) NS.forEach((N, k) => r[k].push((d.close[i + N] / d.close[i] - 1) * 100 - CHI_PHI));
  console.log(`Du lieu: ${duLieu.length} ma, ${suKien.length} su kien. Doi chieu (mua ngau nhien moi 5 phien): lai rong TB T+2 ${f(tb(r[0]))}% | T+3 ${f(tb(r[1]))}% | T+5 ${f(tb(r[2]))}%\n`);
}

console.log("Nhom | n (ma/ngay) | lai rong TB [vuot TT] T+2 / T+3 / T+5 | thang rong T+3 | cham KC 5p | SL/TP: n, lai rong TB, thang | NGOAI MAU 2025+: n, rong T+3 [vuot]\n");
for (const ten of Object.keys(NHOM)) {
  const ds = suKien.filter((s) => s.nhom === ten);
  if (!ds.length) {
    console.log(`${ten}: khong co su kien`);
    continue;
  }
  const nMa = new Set(ds.map((s) => s.ma)).size, nNgay = new Set(ds.map((s) => s.ngay)).size;
  const cot = NS.map((_, k) => `${f(tb(ds.map((s) => s.ret[k] - CHI_PHI)))} [${f(tb(ds.map((s) => s.vuot[k]).filter((v) => v != null)))}]`).join(" / ");
  const thang3 = (ds.filter((s) => s.ret[1] - CHI_PHI > 0).length / ds.length) * 100;
  const chamKC = (ds.filter((s) => s.chamKC).length / ds.length) * 100;
  const sltp = ds.filter((s) => s.kq != null);
  const oos = ds.filter((s) => s.nam >= NAM_OOS);
  console.log(
    `${pad(ten, 62)} n=${ds.length} (${nMa}/${nNgay}) | ${cot} | thang ${f(thang3, 0)}% | chamKC ${f(chamKC, 0)}% | ` +
      `SL/TP n=${sltp.length} ${f(tb(sltp.map((s) => s.kq - CHI_PHI)))}% thang ${f((sltp.filter((s) => s.kq - CHI_PHI > 0).length / (sltp.length || 1)) * 100, 0)}% | ` +
      `2025+ n=${oos.length} ${f(tb(oos.map((s) => s.ret[1] - CHI_PHI)))} [${f(tb(oos.map((s) => s.vuot[1]).filter((v) => v != null)))}]`
  );
}
