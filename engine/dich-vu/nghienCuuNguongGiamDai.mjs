// NGUONG "GIAM DAI" CUA CHECKLIST HOI SAU GIAM DAI (Hieu 2026-10-21: "test nguong 75% di" - NKG giam 28% tu dinh 250 phien nen khong du nguong 65%).
// Tin hieu vao T4 (day 30 phien sau cao hon day truoc + dong cua tren Tenkan 9 va Kijun 17, GTGD TB20 >= 3 ty, dinh 250 phien cach >= 100 phien), mua MO CUA phien sau, moi ma 1 vi the,
// thoat: dong cua duoi MA50 (K17: duoi Kijun 17; CH4: duoi dinh - 4 ATR14), ban mo cua phien sau, cat lo cung -10%, phi 0,4%. Chia theo DAI TY LE dong cua / dinh 250 phien tai nen tin hieu:
//   <= 55% | 55-65% (nguong hien tai la <= 65%) | 65-75% | 75-85% | va cac nguong cong don <= 65% / <= 75% / <= 85%.
// Do: n, lai TB, trung vi, ty le thang, giu TB, PF, ty le cat lo; toan bo / tu 2022-05. Doi chieu them rieng THEP / BDS / CK. CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuNguongGiamDai.mjs
import { docJson } from "./backtestChung.mjs";
import { NGANH } from "../danh-sach/nganh.js";

const cache = docJson("nen_dai.json");
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const med = (a) => { const s = [...a].sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const CP = 0.4, SL = 0.1;
const NGANH_CUA = new Map(); for (const [ten, ds] of NGANH) for (const m of ds) if (!NGANH_CUA.has(m)) NGANH_CUA.set(m, ten);
const NHOM_TEN = (ten) => (ten === "Thep" ? "THEP" : ten === "Chung khoan" ? "CK" : ten === "Bat dong san" || ten === "BDS Khu cong nghiep" ? "BDS" : "KHAC");
const BAND = [["<=55%", 0, 0.55], ["55-65%", 0.55, 0.65], ["65-75%", 0.65, 0.75], ["75-85%", 0.75, 0.85]];
const THOAT = ["MA50", "K17", "CH4"];

const trades = []; // { band, th, ky, nganh, ret, giu, sl }
for (const ma of Object.keys(cache)) {
  const b = cache[ma]; if (!b || b.length < 500) continue;
  const n = b.length, o = b.map((x) => x.o), c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v);
  const pre = [0]; for (let i = 0; i < n; i++) pre.push(pre[i] + c[i]);
  const ma50 = c.map((_, i) => (i + 1 >= 50 ? (pre[i + 1] - pre[i - 49]) / 50 : null));
  const tk = c.map((_, i) => (i >= 8 ? (hh(h, i, 9) + ll(l, i, 9)) / 2 : null)), kj = c.map((_, i) => (i >= 16 ? (hh(h, i, 17) + ll(l, i, 17)) / 2 : null));
  const atr = new Array(n).fill(null);
  { let a = null; for (let i = 1; i < n; i++) { const tr = Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1])); if (i === 14) { let s = 0; for (let j = 1; j <= 14; j++) s += Math.max(h[j] - l[j], Math.abs(h[j] - c[j - 1]), Math.abs(l[j] - c[j - 1])); a = s / 14; } else if (i > 14) a = (a * 13 + tr) / 14; if (i >= 14) atr[i] = a; } }
  const nganh = NHOM_TEN(NGANH_CUA.get(ma) ?? "");
  const ult = {}, dongDen = {};
  for (let i = 260; i < n - 2; i++) {
    const d250 = hh(h, i, 250); const r = c[i] / d250; if (r > 0.85) continue;
    let iP = i; for (let j = i - 249; j <= i; j++) if (h[j] === d250) iP = j;
    if (i - iP < 100) continue;
    let gt = 0; for (let j = i - 19; j <= i; j++) gt += (c[j] * v[j]) / 1e6; if (gt / 20 < 3) continue;
    if (!(ll(l, i, 30) > ll(l, i - 30, 30) && c[i] > tk[i] && c[i] > kj[i])) continue;
    const bi = BAND.findIndex(([, lo, hi]) => r > lo && r <= hi); if (bi < 0) continue;
    if (i - (ult[bi] ?? -99) < 20) continue; ult[bi] = i;
    const E = o[i + 1], ky = b[i].t < "2022-05-01" ? 0 : 1;
    for (const th of THOAT) {
      const key = `${bi}|${th}`; if (i + 1 <= (dongDen[key] ?? -1)) continue;
      let gia = c[n - 1], jt = n - 1, hi = -Infinity, sl = false;
      for (let j = i + 1; j < n; j++) {
        if (l[j] <= E * (1 - SL)) { gia = Math.min(o[j], E * (1 - SL)); jt = j; sl = true; break; }
        hi = Math.max(hi, h[j]);
        const ra = th === "MA50" ? ma50[j] != null && c[j] < ma50[j] : th === "K17" ? kj[j] != null && c[j] < kj[j] : atr[j] != null && c[j] < hi - 4 * atr[j];
        if (ra && j + 1 < n) { gia = o[j + 1]; jt = j + 1; break; }
      }
      dongDen[key] = jt;
      trades.push({ band: bi, th, ky, nganh, ret: (gia / E - 1) * 100 - CP, giu: jt - i, sl });
    }
  }
}
const pf = (a) => { const w = a.filter((x) => x > 0).reduce((s, x) => s + x, 0), l = -a.filter((x) => x <= 0).reduce((s, x) => s + x, 0); return l ? w / l : NaN; };
const dong = (ten, a) => {
  if (a.length < 25) { console.log(`   ${ten.padEnd(22)} n=${String(a.length).padStart(5)} (it mau)`); return; }
  const r = a.map((x) => x.ret);
  console.log(`   ${ten.padEnd(22)} n=${String(a.length).padStart(5)} | lai TB ${f(tb(r), 2).padStart(6)}% trung vi ${f(med(r), 2).padStart(6)}% thang ${f((r.filter((x) => x > 0).length / r.length) * 100, 0)}% | giu TB ${f(tb(a.map((x) => x.giu)), 0).padStart(3)}p | PF ${f(pf(r), 2)} | cat lo ${f((a.filter((x) => x.sl).length / a.length) * 100, 0)}%`);
};
const CONG_DON = [["<= 65% (hien tai)", [0, 1]], ["<= 75%", [0, 1, 2]], ["<= 85%", [0, 1, 2, 3]]];
for (const [tenKy, loc] of [["TOAN BO", () => true], ["TU 2022-05", (x) => x.ky === 1]]) {
  console.log(`\n######## ${tenKy} ########`);
  for (const th of THOAT) {
    console.log(` == vao T4, thoat ${th}`);
    for (let bi = 0; bi < BAND.length; bi++) dong(`dai ${BAND[bi][0]}`, trades.filter((x) => loc(x) && x.th === th && x.band === bi));
    for (const [ten, bands] of CONG_DON) dong(`cong don ${ten}`, trades.filter((x) => loc(x) && x.th === th && bands.includes(x.band)));
  }
}
console.log("\n######## RIENG THEP / BDS / CK, TU 2022-05, thoat MA50 ########");
for (const ng of ["THEP", "BDS", "CK"]) {
  console.log(` -- ${ng}`);
  for (let bi = 0; bi < BAND.length; bi++) dong(`dai ${BAND[bi][0]}`, trades.filter((x) => x.ky === 1 && x.th === "MA50" && x.nganh === ng && x.band === bi));
  dong("cong don <= 75%", trades.filter((x) => x.ky === 1 && x.th === "MA50" && x.nganh === ng && x.band <= 2));
}
