// BACKTEST "NAM CHAM" - kiem tra gia dang GIAM, nam duoi 1 muc "phang" (Senkou B phang / Kijun phang /
// khach san / ca 2) thi sau 2, 3, 5 phien co bi hut len cham muc do khong va lai/lo ra sao.
// Chi DOC cache engine/output/nen_backtest.json (tao boi taiDuLieuBacktest.mjs), khong dung mang.
//
// Quy uoc: tin hieu chot cuoi phien t, VAO tai gia dong cua t, thoat tai gia dong cua t+N (N=2,3,5 - T+2.5 nen
// khong thoat som hon t+2). "Cham" = dinh cao nhat trong t+1..t+N >= muc hut. Lai rong = lai gop - 0.4% phi+thue.
// "Vuot thi truong" = lai cua ma tru trung binh N-phien cua TOAN BO ma thanh khoan cung ngay t (loai anh huong
// ca thi truong hoi chung). Moi ma toi da 1 su kien / 5 phien (giam chong lan).
// CACH CHAY: node engine/dich-vu/backtestNamCham.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tinhIchimoku } from "../loi/ichimoku.js";
import { rsi } from "../loi/taChiBao.js";
import { hhv, llv, sma } from "../loi/mang.js";

const duongDan = fileURLToPath(new URL("../output/nen_backtest.json", import.meta.url));
const cache = JSON.parse(readFileSync(duongDan, "utf-8"));

const NS = [2, 3, 5];
const CHI_PHI = 0.4; // % ca vong (phi mua+ban + thue ban 0.1%)
const SO_PHIEN_PHANG = 5;
const GTGD_TOI_THIEU_TY = 5; // chi xet ma thanh khoan >= 5 ty/phien (TB20) - danh T+ phai mua ban duoc
const CACH_TOI_THIEU_PCT = 3; // muc hut phai cach gia it nhat 3% (sat qua thi khong co "hut")
const CACH_TOI_DA_PCT = 20;

// ---------- 1. Chi bao + ung vien tung ma ----------
const duLieu = [];
for (const [ma, nen] of Object.entries(cache)) {
  const n = nen.length;
  const high = nen.map((b) => b.h);
  const low = nen.map((b) => b.l);
  const close = nen.map((b) => b.c);
  const open = nen.map((b) => b.o);
  const vol = nen.map((b) => b.v);
  const ich = tinhIchimoku({ high, low });
  const rsi14 = rsi({ close }, 14);
  const gtgd = sma(close.map((c, i) => (c * vol[i]) / 1e6), 20); // ty dong/phien (gia nghin dong * KL / 1e6)
  const phang = (mang) => {
    const cao = hhv(mang, SO_PHIEN_PHANG);
    const thap = llv(mang, SO_PHIEN_PHANG);
    return mang.map((v, i) => v != null && cao[i] != null && thap[i] != null && cao[i] - thap[i] === 0);
  };
  const kPhang = phang(ich.kijun);
  const sbPhang = phang(ich.senkouB);
  duLieu.push({ ma, nen, n, high, low, close, open, vol, ich, rsi14, gtgd, kPhang, sbPhang });
}

// ---------- 2. Trung binh thi truong theo ngay (de tinh "vuot thi truong") ----------
const thiTruong = NS.map(() => new Map()); // [idxN] -> Map(ngay -> {tong, dem})
for (const d of duLieu) {
  for (let i = 80; i < d.n; i++) {
    if (!(d.gtgd[i] >= GTGD_TOI_THIEU_TY)) continue;
    NS.forEach((N, k) => {
      if (i + N >= d.n) return;
      const r = d.close[i + N] / d.close[i] - 1;
      const m = thiTruong[k].get(d.nen[i].t) ?? { tong: 0, dem: 0 };
      m.tong += r;
      m.dem += 1;
      thiTruong[k].set(d.nen[i].t, m);
    });
  }
}
const tbNgay = (k, ngay) => {
  const m = thiTruong[k].get(ngay);
  return m && m.dem >= 30 ? m.tong / m.dem : null;
};

// ---------- 3. Dinh nghia nhom su kien ----------
// Moi nhom tra ve muc hut (level) neu bar i thoa, nguoc lai null. Tat ca deu la "gia DANG GIAM, nam DUOI muc".
const giamDan = (d, i) => d.close[i] < d.close[i - 5];
const NHOM = {
  "SenkouB phang": (d, i) => (d.sbPhang[i] && d.ich.senkouB[i] > d.close[i] ? d.ich.senkouB[i] : null),
  "SenkouB KHONG phang (doi chung)": (d, i) => (!d.sbPhang[i] && d.ich.senkouB[i] > d.close[i] ? d.ich.senkouB[i] : null),
  "Kijun phang": (d, i) => (d.kPhang[i] && d.ich.kijun[i] > d.close[i] ? d.ich.kijun[i] : null),
  "Kijun KHONG phang (doi chung)": (d, i) => (!d.kPhang[i] && d.ich.kijun[i] > d.close[i] ? d.ich.kijun[i] : null),
  "Khach san giam (Kijun phang + Tenkan doc xuong + gia duoi Tenkan)": (d, i) =>
    d.kPhang[i] && d.ich.kijun[i] > d.close[i] && d.ich.tenkan[i] < d.ich.tenkan[i - 3] && d.close[i] < d.ich.tenkan[i] ? d.ich.kijun[i] : null,
  "CA HAI phang (Kijun + SenkouB), gia duoi ca 2": (d, i) =>
    d.kPhang[i] && d.sbPhang[i] && d.ich.kijun[i] > d.close[i] && d.ich.senkouB[i] > d.close[i] ? Math.min(d.ich.kijun[i], d.ich.senkouB[i]) : null,
};
const BIEN_THE = {
  "vao ngay": () => true,
  "+RSI<35": (d, i) => d.rsi14[i] != null && d.rsi14[i] < 35,
  "+nen xanh bat len": (d, i) => d.close[i] > d.open[i] && d.close[i] > d.close[i - 1],
};

// ---------- 4. Sinh su kien ----------
const suKien = []; // { nhom, bienThe, ma, ngay, nam, cach, ret:[], chamTP:[], mae:[], vuot:[] }
for (const d of duLieu) {
  for (const [tenNhom, hamNhom] of Object.entries(NHOM)) {
    for (const [tenBT, hamBT] of Object.entries(BIEN_THE)) {
      let luc = -100;
      for (let i = 80; i < d.n - 1; i++) {
        if (i - luc < 5) continue;
        if (!(d.gtgd[i] >= GTGD_TOI_THIEU_TY)) continue;
        if (d.high[i] === d.low[i]) continue; // nen khoa tran/san, khong mua duoc
        if (!giamDan(d, i)) continue;
        const level = hamNhom(d, i);
        if (level == null) continue;
        const cach = (level / d.close[i] - 1) * 100;
        if (cach < CACH_TOI_THIEU_PCT || cach > CACH_TOI_DA_PCT) continue;
        if (!hamBT(d, i)) continue;
        const sk = { nhom: tenNhom, bienThe: tenBT, ma: d.ma, ngay: d.nen[i].t, nam: d.nen[i].t.slice(0, 4), cach, ret: [], cham: [], mae: [], vuot: [] };
        let du = true;
        NS.forEach((N, k) => {
          if (i + N >= d.n) {
            du = false;
            return;
          }
          const r = d.close[i + N] / d.close[i] - 1;
          let cao = -Infinity;
          let thap = Infinity;
          for (let j = i + 1; j <= i + N; j++) {
            cao = Math.max(cao, d.high[j]);
            thap = Math.min(thap, d.low[j]);
          }
          const tb = tbNgay(k, sk.ngay);
          sk.ret.push(r * 100);
          sk.cham.push(cao >= level);
          sk.mae.push((thap / d.close[i] - 1) * 100);
          sk.vuot.push(tb == null ? null : (r - tb) * 100);
        });
        if (!du) continue; // chua du du lieu tuong lai cho N lon nhat - bo, khong danh gia thieu
        suKien.push(sk);
        luc = i;
      }
    }
  }
}

// ---------- 5. Thong ke ----------
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const trungVi = (a) => {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const f = (v, dp = 2) => (Number.isFinite(v) ? v.toFixed(dp) : "  -  ");

function bang(dsSK, nhan) {
  const nMa = new Set(dsSK.map((s) => s.ma)).size;
  const nNgay = new Set(dsSK.map((s) => s.ngay)).size;
  let dong = `${nhan}\n   n=${dsSK.length} (${nMa} ma, ${nNgay} ngay)`;
  NS.forEach((N, k) => {
    const ret = dsSK.map((s) => s.ret[k]);
    const rong = ret.map((r) => r - CHI_PHI);
    const vuot = dsSK.map((s) => s.vuot[k]).filter((v) => v != null);
    dong += `\n   T+${N}: cham ${f((dsSK.filter((s) => s.cham[k]).length / dsSK.length) * 100, 0)}% | lai gop TB ${f(tb(ret))}% (trung vi ${f(trungVi(ret))}%) | ` +
      `thang rong ${f((rong.filter((r) => r > 0).length / rong.length) * 100, 0)}% | lai rong TB ${f(tb(rong))}% | vuot TT ${f(tb(vuot))}% | MAE TB ${f(tb(dsSK.map((s) => s.mae[k])))}%`;
  });
  return dong;
}

console.log(`Du lieu: ${duLieu.length} ma, ${suKien.length} su kien (sau loc thanh khoan >= ${GTGD_TOI_THIEU_TY} ty, cach muc ${CACH_TOI_THIEU_PCT}-${CACH_TOI_DA_PCT}%).\n`);
for (const tenBT of Object.keys(BIEN_THE)) {
  console.log(`================ BIEN THE: ${tenBT} ================`);
  for (const tenNhom of Object.keys(NHOM)) {
    const ds = suKien.filter((s) => s.nhom === tenNhom && s.bienThe === tenBT);
    if (ds.length) console.log(bang(ds, `\n[${tenNhom}]`));
  }
  console.log();
}

// Theo khoang cach toi muc hut + theo nam cho cac nhom chinh (vao ngay), T+3
console.log("================ CHI TIET (vao ngay) ================");
for (const tenNhom of ["SenkouB phang", "Kijun phang", "Khach san giam (Kijun phang + Tenkan doc xuong + gia duoi Tenkan)", "CA HAI phang (Kijun + SenkouB), gia duoi ca 2"]) {
  const ds = suKien.filter((s) => s.nhom === tenNhom && s.bienThe === "vao ngay");
  console.log(`\n[${tenNhom}] theo khoang cach toi muc hut / theo nam (T+3: cham%, lai rong TB%, vuot TT%)`);
  for (const [lo, hi] of [[3, 6], [6, 10], [10, 20]]) {
    const x = ds.filter((s) => s.cach >= lo && s.cach < hi);
    if (x.length >= 10)
      console.log(`   cach ${lo}-${hi}%: n=${x.length} cham ${f((x.filter((s) => s.cham[1]).length / x.length) * 100, 0)}% lai rong ${f(tb(x.map((s) => s.ret[1] - CHI_PHI)))} vuot ${f(tb(x.map((s) => s.vuot[1]).filter((v) => v != null)))}`);
  }
  for (const nam of [...new Set(ds.map((s) => s.nam))].sort()) {
    const x = ds.filter((s) => s.nam === nam);
    if (x.length >= 10)
      console.log(`   nam ${nam}: n=${x.length} cham ${f((x.filter((s) => s.cham[1]).length / x.length) * 100, 0)}% lai rong ${f(tb(x.map((s) => s.ret[1] - CHI_PHI)))} vuot ${f(tb(x.map((s) => s.vuot[1]).filter((v) => v != null)))}`);
  }
}
