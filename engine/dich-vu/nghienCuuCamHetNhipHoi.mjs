// CAM HET NHIP HOI, KHONG CO DINH SO PHIEN (Hieu 2026-10-21: "toi muon cam het nhip hoi chu ko co dinh bn phien").
// Nhom co phieu DAI HAN GIAM (dong cua <= 65% dinh 250 phien, dinh cach >= 100 phien, GTGD TB20 >= 3 ty) nhu nghienCuuHoiSauGiamDai.mjs. Dieu kien VAO (mua MO CUA phien sau, moi ma chi 1 vi the mo tai 1 thoi diem cho tung cap vao/thoat):
//  T1 diem B ngay | T3 pha vung tich luy 40 phien co KL | T4 day sau cao hon day truoc + tren Tenkan/Kijun | T5 MA20 cat len MA50 | CS = co so (moi 10 phien, doi chieu)
// Quy tac THOAT = giu cho toi khi nhip hoi gay (bao dong cua), ban MO CUA phien sau khi bao hieu, khong gioi han so phien (het du lieu thi tinh theo gia dong cua cuoi, danh dau "dang mo"):
//  K17 dong cua duoi Kijun 17 | TK9 dong cua duoi Tenkan 9 | MA50 dong cua duoi MA50 | CH3 / CH4 chandelier: dong cua duoi (dinh cao nhat tu luc vao - 3 / 4 x ATR14)
//  + cat lo cung SL -10% (low cham gia vao x 0,9 -> ban gia do hoac gia mo cua neu gap), phi 0,4% / vong.
// Do: lai/lenh (TB, trung vi, ty le thang), so phien giu TB, he so loi nhuan (tong lai / tong lo), lai lon nhat / lo lon nhat; toan bo / tu 2022-05; rieng THEP / BDS / CK cho cap tot nhat. CHI DOC cache.
// CACH CHAY: node engine/dich-vu/nghienCuuCamHetNhipHoi.mjs
import { docJson } from "./backtestChung.mjs";
import { NGANH } from "../danh-sach/nganh.js";

const cache = docJson("nen_dai.json");
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const med = (a) => { const s = [...a].sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const CP = 0.4, SL = 0.1;
const nganhSet = (...t) => new Set(t.flatMap((k) => [...(NGANH.get(k) ?? [])]));
const NHOM_NGANH = { THEP: nganhSet("Thep"), BDS: nganhSet("Bat dong san", "BDS Khu cong nghiep"), CK: nganhSet("Chung khoan") };
const THOAT = ["K17", "TK9", "MA50", "CH3", "CH4"];
const VAO = ["CS", "T1", "T3", "T4", "T5"];

const kq = {}; // `${vao}|${thoat}` -> [trade]
for (const ma of Object.keys(cache)) {
  const b = cache[ma]; if (!b || b.length < 500) continue;
  const n = b.length, o = b.map((x) => x.o), c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v);
  const pre = [0]; for (let i = 0; i < n; i++) pre.push(pre[i] + c[i]);
  const sma = (i, k) => (i + 1 >= k ? (pre[i + 1] - pre[i + 1 - k]) / k : null);
  const ma50 = c.map((_, i) => sma(i, 50)), ma20 = c.map((_, i) => sma(i, 20));
  const tk = c.map((_, i) => (i >= 8 ? (hh(h, i, 9) + ll(l, i, 9)) / 2 : null)), kj = c.map((_, i) => (i >= 16 ? (hh(h, i, 17) + ll(l, i, 17)) / 2 : null));
  const atr = new Array(n).fill(null);
  { let a = null; for (let i = 1; i < n; i++) { const tr = Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1])); if (i === 14) { let s = 0; for (let j = 1; j <= 14; j++) s += Math.max(h[j] - l[j], Math.abs(h[j] - c[j - 1]), Math.abs(l[j] - c[j - 1])); a = s / 14; } else if (i > 14) a = (a * 13 + tr) / 14; if (i >= 14) atr[i] = a; } }
  const nganh = Object.entries(NHOM_NGANH).find(([, s]) => s.has(ma))?.[0] ?? "KHAC";
  const ultVao = {}; const dongDen = {}; // dedupe 20 phien / vi the dang mo
  for (let i = 260; i < n - 2; i++) {
    const d250 = hh(h, i, 250); if (!(c[i] <= 0.65 * d250)) continue;
    let iP = i; for (let j = i - 249; j <= i; j++) if (h[j] === d250) iP = j;
    if (i - iP < 100) continue;
    let gt = 0; for (let j = i - 19; j <= i; j++) gt += (c[j] * v[j]) / 1e6; if (gt / 20 < 3) continue;
    const vaoOk = {};
    if (i % 10 === 0) vaoOk.CS = true;
    const day20 = ll(l, i, 20); let kDay = i; for (let j = i - 19; j <= i; j++) if (l[j] <= day20) kDay = j;
    if (c[i] > tk[i] && c[i] > kj[i] && i - kDay >= 3) vaoOk.T1 = true;
    { const d40 = hh(h, i - 1, 40), t40 = ll(l, i - 1, 40); let s = 0; for (let j = i - 20; j < i; j++) s += v[j]; s /= 20; if (c[i] > d40 && (d40 - t40) / d40 <= 0.35 && s > 0 && v[i] >= 1.5 * s) vaoOk.T3 = true; }
    if (ll(l, i, 30) > ll(l, i - 30, 30) && c[i] > tk[i] && c[i] > kj[i]) vaoOk.T4 = true;
    if (ma20[i] != null && ma50[i] != null && ma20[i] > ma50[i] && ma20[i - 1] <= ma50[i - 1]) vaoOk.T5 = true;
    for (const vao of VAO) {
      if (!vaoOk[vao] || i - (ultVao[vao] ?? -99) < 20) continue;
      ultVao[vao] = i;
      const E = o[i + 1], ky = b[i].t < "2022-05-01" ? 0 : 1;
      for (const th of THOAT) {
        const key = `${vao}|${th}`;
        if (i + 1 <= (dongDen[key] ?? -1)) continue; // dang giu vi the cu cua cap nay
        let gia = c[n - 1], jt = n - 1, dang = true, lydo = "mo";
        let hi = -Infinity;
        for (let j = i + 1; j < n; j++) {
          if (l[j] <= E * (1 - SL)) { gia = Math.min(o[j], E * (1 - SL)); jt = j; dang = false; lydo = "SL"; break; }
          hi = Math.max(hi, h[j]);
          let ra = false;
          if (th === "K17") ra = kj[j] != null && c[j] < kj[j];
          else if (th === "TK9") ra = tk[j] != null && c[j] < tk[j];
          else if (th === "MA50") ra = ma50[j] != null && c[j] < ma50[j];
          else if (th === "CH3") ra = atr[j] != null && c[j] < hi - 3 * atr[j];
          else if (th === "CH4") ra = atr[j] != null && c[j] < hi - 4 * atr[j];
          if (ra && j + 1 < n) { gia = o[j + 1]; jt = j + 1; dang = false; lydo = "tin hieu"; break; }
        }
        dongDen[key] = jt;
        (kq[key] ||= []).push({ ky, nganh, ret: (gia / E - 1) * 100 - CP, giu: jt - i, dang, lydo });
      }
    }
  }
}
const pf = (a) => { const w = a.filter((x) => x > 0).reduce((s, x) => s + x, 0), l = -a.filter((x) => x <= 0).reduce((s, x) => s + x, 0); return l ? w / l : NaN; };
const dong = (ten, a) => {
  if (a.length < 25) { console.log(`  ${ten.padEnd(10)} n=${String(a.length).padStart(5)} (it mau)`); return; }
  const r = a.map((x) => x.ret);
  console.log(`  ${ten.padEnd(10)} n=${String(a.length).padStart(5)} | lai TB ${f(tb(r), 2).padStart(6)}% trung vi ${f(med(r), 2).padStart(6)}% thang ${f((r.filter((x) => x > 0).length / r.length) * 100, 0)}% | giu TB ${f(tb(a.map((x) => x.giu)), 0).padStart(3)} phien | PF ${f(pf(r), 2)} | max +${f(Math.max(...r), 0)}% / ${f(Math.min(...r), 0)}% | dang mo ${a.filter((x) => x.dang).length} | SL ${f((a.filter((x) => x.lydo === "SL").length / a.length) * 100, 0)}%`);
};
for (const [tenKy, loc] of [["TOAN BO", () => true], ["TU 2022-05", (x) => x.ky === 1]]) {
  console.log(`\n######## ${tenKy} (lai/lenh sau phi, mua mo cua phien sau, thoat mo cua phien sau bao hieu) ########`);
  for (const vao of VAO) { console.log(` == vao ${vao}`); for (const th of THOAT) dong(th, (kq[`${vao}|${th}`] ?? []).filter(loc)); }
}
console.log("\n######## RIENG THEP / BDS / CK, TU 2022-05 (vao T4 va T3, thoat K17 / MA50 / CH3) ########");
for (const ng of ["THEP", "BDS", "CK"]) for (const vao of ["T4", "T3"]) { console.log(` == ${ng}, vao ${vao}`); for (const th of ["K17", "MA50", "CH3"]) dong(th, (kq[`${vao}|${th}`] ?? []).filter((x) => x.ky === 1 && x.nganh === ng)); }
