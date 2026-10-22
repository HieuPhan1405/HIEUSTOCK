// TAM GIAC GIAM DAI HAN (Hieu 2026-10-22: PVD - flat day + dinh thap dan keo dai ~9 thang, web khong bao; "test"). Phat hien tren cua so W nen ngay (120 / 180), chi dung du lieu den nen xet i:
//  - DAY PHANG: day thap nhat L cua cua so; >= 3 day xoay (pivot 5 nen moi ben, cach nhau >= 10 nen) nam trong [L, L x 1,02];
//  - KHANG CU DOC XUONG: >= 3 dinh xoay trong cua so, duong hoi quy tuyen tinh qua cac dinh co do doc < 0, giam >= 8% gia tri tren ca cua so, R2 >= 0,6, dinh dau cao hon day phang >= 12%;
//  - khong dong cua nao truoc nen i vuot duong khang cu qua 2%.
// SU KIEN: (a) PHA LEN = dong cua > duong khang cu x 1,01 va hom truoc <= x 1,01 (co / khong KL >= 1,5x TB20); (b) PHA XUONG = dong cua < day phang x 0,99 (nen dau); (c) DANG GAN KHANG CU = dong cua trong tam giac va cach duong khang cu <= 3% (trang thai, 1 lan / 20 nen).
// Do: vao MO CUA phien sau, lai 5 / 10 / 20 / 60 phien THEO HUONG (tang: da tru phi 0,4%), ty le thang; so voi CO SO (moi 5 nen moi ma). Truoc 2022-05 / tu 2022-05. Cuoi: trang thai hien tai cua PVD. CHI DOC cache. CACH CHAY: node engine/dich-vu/backtestTamGiacDai.mjs
import { docJson } from "./backtestChung.mjs";

const cache = docJson("nen_dai.json");
const CP = 0.4;
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const th = (a) => (a.length ? (a.filter((x) => x > 0).length / a.length) * 100 : NaN);
const NP = 5;

function pivots(h, l, a, b) {
  const pH = [], pL = [];
  for (let j = a + NP; j <= b - NP; j++) {
    let isH = true, isL = true;
    for (let k = j - NP; k <= j + NP; k++) { if (h[k] > h[j]) isH = false; if (l[k] < l[j]) isL = false; }
    if (isH) pH.push(j);
    if (isL) pL.push(j);
  }
  return { pH, pL };
}
// Tam giac giam trong cua so [a, i]: dung pivot da xac nhan (den i - NP). Tra ve { S, a1, b1 (duong y = a1 + b1 * j) } hoac null.
function tamGiac(h, l, c, a, i) {
  const { pH, pL } = pivots(h, l, a, i);
  if (pH.length < 3 || pL.length < 3) return null;
  let L = Infinity; for (let j = a; j <= i; j++) if (l[j] < L) L = l[j];
  const cham = []; for (const j of pL) if (l[j] <= L * 1.02 && (!cham.length || j - cham[cham.length - 1] >= 10)) cham.push(j);
  if (cham.length < 3) return null;
  // hoi quy tuyen tinh dinh xoay
  const n = pH.length; let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
  for (const j of pH) { sx += j; sy += h[j]; sxx += j * j; sxy += j * h[j]; syy += h[j] * h[j]; }
  const den = n * sxx - sx * sx; if (!den) return null;
  const b1 = (n * sxy - sx * sy) / den, a1 = (sy - b1 * sx) / n;
  const r2 = (() => { const ssTot = syy - (sy * sy) / n; let ssRes = 0; for (const j of pH) ssRes += (h[j] - (a1 + b1 * j)) ** 2; return ssTot > 0 ? 1 - ssRes / ssTot : 0; })();
  const dau = a1 + b1 * pH[0], cuoi = a1 + b1 * i;
  if (!(b1 < 0) || r2 < 0.6 || (dau - cuoi) / dau < 0.08 || dau < L * 1.12) return null;
  for (let j = a; j < i; j++) if (c[j] > (a1 + b1 * j) * 1.02) return null;
  return { S: L, a1, b1, duong: (j) => a1 + b1 * j };
}

const ev = { PHA_LEN: [], PHA_LEN_KL: [], PHA_XUONG: [], GAN_KHANG_CU: [], CO_SO: [] };
const hienTai = {};
for (const [ma, b] of Object.entries(cache)) {
  const n = b.length; if (n < 400) continue;
  const c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v), o = b.map((x) => x.o), t = b.map((x) => x.t);
  const gt = []; let g = 0; for (let i = 0; i < n; i++) { g += (c[i] * v[i]) / 1e6; if (i >= 20) g -= (c[i - 20] * v[i - 20]) / 1e6; gt.push(i >= 19 ? g / 20 : 0); }
  const ghi = (i, huong) => {
    const E = o[i + 1]; if (!(E > 0)) return null;
    const r = (k) => (c[i + 1 + k] ? (huong >= 0 ? (c[i + 1 + k] / E - 1) * 100 - CP : -((c[i + 1 + k] / E - 1) * 100)) : null);
    return { ky: t[i] < "2022-05-01" ? 0 : 1, r5: r(5), r10: r(10), r20: r(20), r60: r(60) };
  };
  const ult = {};
  for (let i = 200; i < n - 1; i++) {
    if (gt[i] < 3) continue;
    if (i % 5 === 0 && i < n - 62) { const x = ghi(i, 1); if (x) ev.CO_SO.push(x); }
    for (const W of [120, 180]) {
      const tg = tamGiac(h, l, c, i - W, i - 1); // cua so den nen i - 1 (nen i la nen xet su kien)
      if (!tg) continue;
      const kc = tg.duong(i), kcTruoc = tg.duong(i - 1);
      let tbv = 0; for (let j = i - 20; j < i; j++) tbv += v[j]; tbv /= 20;
      const lap = (k, huong, x) => { if (i - (ult[k] ?? -99) < 20) return; ult[k] = i; const r = ghi(i, huong); if (r) ev[x].push(r); };
      if (c[i] > kc * 1.01 && c[i - 1] <= kcTruoc * 1.01) { lap(`len${W}`, 1, "PHA_LEN"); if (v[i] >= 1.5 * tbv) lap(`lenkl${W}`, 1, "PHA_LEN_KL"); }
      else if (c[i] < tg.S * 0.99 && c[i - 1] >= tg.S * 0.99) lap(`xuong${W}`, -1, "PHA_XUONG");
      else if (c[i] <= kc * 1.01 && c[i] >= tg.S * 0.99 && (kc - c[i]) / kc <= 0.03) lap(`gan${W}`, 1, "GAN_KHANG_CU");
    }
  }
  if (ma === "PVD") for (const W of [120, 180, 250]) { const tg = tamGiac(h, l, c, n - 1 - W, n - 1); hienTai[W] = tg ? { S: tg.S.toFixed(2), kc: tg.duong(n - 1).toFixed(2), c: c[n - 1], cach: (((tg.duong(n - 1)) - c[n - 1]) / tg.duong(n - 1) * 100).toFixed(1) + "%", doc: (tg.b1 * 20).toFixed(2) + "/20 nen" } : null; }
}
const dong = (ten, a) => (a.length < 20
  ? console.log(`   ${ten.padEnd(34)} n=${String(a.length).padStart(5)} (it mau)`)
  : console.log(`   ${ten.padEnd(34)} n=${String(a.length).padStart(5)} | 5p ${f(tb(a.map((x) => x.r5).filter((x) => x != null))).padStart(5)} | 10p ${f(tb(a.map((x) => x.r10).filter((x) => x != null))).padStart(5)} [${f(th(a.map((x) => x.r10).filter((x) => x != null)), 0)}%] | 20p ${f(tb(a.map((x) => x.r20).filter((x) => x != null))).padStart(5)} [${f(th(a.map((x) => x.r20).filter((x) => x != null)), 0)}%] | 60p ${f(tb(a.map((x) => x.r60).filter((x) => x != null))).padStart(5)} [${f(th(a.map((x) => x.r60).filter((x) => x != null)), 0)}%]`));
const TEN = { PHA_LEN: "PHA LEN khang cu", PHA_LEN_KL: "PHA LEN + KL >= 1,5x", PHA_XUONG: "PHA XUONG day (lai theo huong giam)", GAN_KHANG_CU: "DANG GAN khang cu (<= 3%)", CO_SO: "CO SO (moi 5 nen)" };
for (const [tk, loc] of [["TOAN BO", () => true], ["TRUOC 2022-05", (x) => x.ky === 0], ["TU 2022-05", (x) => x.ky === 1]]) {
  console.log(`\n######## ${tk} ########`);
  for (const k of ["PHA_LEN", "PHA_LEN_KL", "GAN_KHANG_CU", "PHA_XUONG", "CO_SO"]) dong(TEN[k], ev[k].filter(loc));
}
console.log("\nPVD hien tai (cua so tam giac den 21/10):", JSON.stringify(hienTai));
