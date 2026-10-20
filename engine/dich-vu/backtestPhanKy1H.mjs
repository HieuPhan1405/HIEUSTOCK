// BACKTEST BAT DAY NHIP HOI KHUNG 1 GIO (Hieu 2026-10-21: "xem khung 1h de danh dau co, bat day nhip hoi, vd CEO co phan ky khung h1 kieu V").
// Nen 1 gio 387 ma (nen_1h.json, 10/2023 - 10/2026, gia dieu chinh). Tin hieu (NHAN QUA, xac nhan sau 3 nen):
//   PK-RSI : 2 day 1 gio (pivot 3 nen moi ben), day sau THAP HON day truoc >= 0,3% nhung RSI14 CAO HON >= 3 diem, RSI day truoc < 40 (phan ky tang gia kinh dien), cach nhau 6-60 nen.
//   PK-MACD: nhu tren nhung dung histogram MACD(12,26,9) (day sau cao hon day truoc, ca hai am).
//   V      : PK-RSI + gia truoc day roi >= 8% trong 40 nen + nen xac nhan dong cua vuot dinh cua cac nen tu day (hinh chu V).
//   Doi chieu: day 1 gio co RSI < 35 KHONG phan ky; va "cham RSI < 30 lan dau".
// Vao: dong cua nen xac nhan (bo neu da cao hon day > 5%). Hang ve T+2,5: chi duoc ban tu nen 13:00 ngay T+2. Thanh khoan: GTGD TB 20 ngay >= 10 ty. Phi 0,4%/lenh.
// Thoat: (a) giu H ngay giao dich (3 / 5 / 10), ban o dong cua ngay do; (b) chot +8% / cat -5% (chi tinh tu luc duoc ban, cat lo cung nen dau tien neu da duoi muc cat) / het han 10 ngay.
// CACH CHAY: node engine/dich-vu/backtestPhanKy1H.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const h1 = JSON.parse(readFileSync(fileURLToPath(new URL("../output/nen_1h.json", import.meta.url)), "utf-8"));
const CP = 0.4;
const K = Number(process.env.PK || 3); // so nen moi ben cua day (xac nhan sau K nen)
const CHASE = 1 + Number(process.env.CHASE || 5) / 100; // bo tin hieu neu gia xac nhan cao hon day qua muc nay

const wilder = (x, n) => { const o = new Array(x.length).fill(null); let e = null; for (let i = 0; i < x.length; i++) { if (i === n) { let s = 0; for (let j = 1; j <= n; j++) s += x[j]; e = s / n; o[i] = e; } else if (i > n) { e = (e * (n - 1) + x[i]) / n; o[i] = e; } } return o; };
function rsi(c, n = 14) {
  const g = [0], l = [0];
  for (let i = 1; i < c.length; i++) { const d = c[i] - c[i - 1]; g.push(Math.max(d, 0)); l.push(Math.max(-d, 0)); }
  const ag = wilder(g, n), al = wilder(l, n);
  return c.map((_, i) => (ag[i] == null ? null : al[i] === 0 ? 100 : 100 - 100 / (1 + ag[i] / al[i])));
}
const ema = (x, n) => { const k = 2 / (n + 1); const o = []; let e = x[0]; for (let i = 0; i < x.length; i++) { e = i === 0 ? x[0] : x[i] * k + e * (1 - k); o.push(e); } return o; };
const macdH = (c) => { const a = ema(c, 12), b = ema(c, 26); const m = c.map((_, i) => a[i] - b[i]); const s = ema(m, 9); return m.map((v, i) => v - s[i]); };
const ngayVN = (t) => new Date((t + 7 * 3600) * 1000).toISOString().slice(0, 10);
const gioVN = (t) => new Date((t + 7 * 3600) * 1000).getUTCHours();

const SIG = { "PK-RSI": [], "PK-MACD": [], "V (PK-RSI + hinh chu V)": [], "Doi chieu: day 1h RSI<35 KHONG phan ky": [], "Doi chieu: cham RSI<30 lan dau": [] };
let soMa = 0;
for (const ma of Object.keys(h1)) {
  const x = h1[ma]; const n = x.t.length; if (n < 200) continue; soMa++;
  const c = x.c, l = x.l, hi = x.h, v = x.v;
  const ngay = x.t.map(ngayVN), gio = x.t.map(gioVN);
  // chi so ngay giao dich cua tung nen + GTGD ngay
  const ds = [], dayOf = new Array(n);
  for (let i = 0; i < n; i++) { if (i === 0 || ngay[i] !== ngay[i - 1]) ds.push({ start: i, end: i, gt: 0 }); dayOf[i] = ds.length - 1; ds[ds.length - 1].end = i; ds[ds.length - 1].gt += (c[i] * v[i]) / 1e6; }
  const gtTB20 = (d) => (d < 20 ? 0 : ds.slice(d - 20, d).reduce((s, q) => s + q.gt, 0) / 20);
  const r = rsi(c), mh = macdH(c);
  const piv = [];
  for (let p = K; p < n - K; p++) {
    let ok = true;
    for (let k = 1; k <= K; k++) if (!(l[p] < l[p - k] && l[p] <= l[p + k])) { ok = false; break; }
    if (ok) piv.push(p);
  }
  const sig = (ten, s, p) => { if (c[s] > l[p] * CHASE) return; if (gtTB20(dayOf[s]) < 10) return; const arr = SIG[ten]; const ult = arr.length ? arr[arr.length - 1] : null; if (ult && ult.ma === ma && s - ult.i < 20) return; arr.push({ ma, i: s, p, ngay: ngay[s] }); };
  let r30 = false;
  for (let i = 15; i < n; i++) { if (r[i] != null && r[i] < 30) { if (!r30) { r30 = true; if (i < n - 1) sig("Doi chieu: cham RSI<30 lan dau", i, i); } } else if (r[i] != null && r[i] > 40) r30 = false; }
  for (let a = 0; a < piv.length; a++) {
    const p = piv[a], s = p + K; if (s >= n - 1 || r[p] == null) continue;
    let q = -1;
    for (let b = a - 1; b >= 0 && p - piv[b] <= 60; b--) if (p - piv[b] >= 6) { q = piv[b]; break; }
    const pkR = q >= 0 && r[q] != null && l[p] < l[q] * 0.997 && r[p] > r[q] + 3 && r[q] < 40;
    const pkM = q >= 0 && l[p] < l[q] * 0.997 && mh[p] > mh[q] && mh[q] < 0 && mh[p] < 0;
    if (pkR) sig("PK-RSI", s, p);
    if (pkM) sig("PK-MACD", s, p);
    if (pkR) {
      let mx = 0; for (let j = Math.max(0, p - 40); j <= p; j++) mx = Math.max(mx, hi[j]);
      let cm = 0; for (let j = p; j < s; j++) cm = Math.max(cm, c[j]);
      if ((mx - l[p]) / mx >= 0.08 && c[s] > cm) sig("V (PK-RSI + hinh chu V)", s, p);
    }
    if (!pkR && r[p] < 35) sig("Doi chieu: day 1h RSI<35 KHONG phan ky", s, p);
  }
  // luu du lieu ma de mo phong
  for (const arr of Object.values(SIG)) for (const e of arr) if (e.ma === ma && !e.d) e.d = { n, c, l, hi, ngay, gio, dayOf, ds };
}
console.log(`Quet ${soMa} ma nen 1 gio.`);

// ---- mo phong thoat ----
function ketThucNgay(d, e, H) { // dong cua cua ngay giao dich thu dayOf[e] + H
  const dd = d.dayOf[e.i] + H; if (dd >= d.ds.length) return null;
  return d.c[d.ds[dd].end];
}
function banDuoc(d, e) { // nen dau tien duoc ban: nen 13:00 cua ngay T+2
  const dd = d.dayOf[e.i] + 2; if (dd >= d.ds.length) return -1;
  for (let i = d.ds[dd].start; i <= d.ds[dd].end; i++) if (d.gio[i] >= 13) return i;
  return d.ds[dd].end;
}
const hold = (H) => (e) => { const d = e.d; const z = ketThucNgay(d, e, H); if (z == null) return null; return (z / d.c[e.i] - 1) * 100 - CP; };
const tpsl = (tp, sl, maxD) => (e) => {
  const d = e.d, E = d.c[e.i], b = banDuoc(d, e); if (b < 0) return null;
  const fin = d.dayOf[e.i] + maxD; if (fin >= d.ds.length) return null;
  const last = d.ds[fin].end;
  for (let i = b; i <= last; i++) {
    if (d.l[i] <= E * (1 - sl / 100)) { const gia = Math.min(E * (1 - sl / 100), d.c[i - 1] ?? E); return (gia / E - 1) * 100 - CP; }
    if (d.hi[i] >= E * (1 + tp / 100)) return tp - CP;
  }
  return (d.c[last] / E - 1) * 100 - CP;
};
const PF = (a) => { const w = a.filter((x) => x > 0).reduce((s, x) => s + x, 0), l = -a.filter((x) => x <= 0).reduce((s, x) => s + x, 0); return l ? w / l : NaN; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const EXITS = [["giu 3 ngay", hold(3)], ["giu 5 ngay", hold(5)], ["giu 10 ngay", hold(10)], ["chot +8% / cat -5% (toi da 10 ngay)", tpsl(8, 5, 10)]];

const nam = (e) => e.ngay.slice(0, 4);
console.log("\nKET QUA (lai TB % / lenh sau phi 0,4%; trong ngoac = so lenh)");
for (const [ten, arr] of Object.entries(SIG)) {
  console.log(`\n=== ${ten}: ${arr.length} tin hieu ===`);
  for (const [tx, fn] of EXITS) {
    const kq = arr.map((e) => ({ e, r: fn(e) })).filter((x) => x.r != null);
    const a = kq.map((x) => x.r);
    const py = (y) => { const z = kq.filter((x) => nam(x.e) === y).map((x) => x.r); return z.length ? `${f(tb(z))} (${z.length})` : "-"; };
    console.log(`  ${tx.padEnd(36)} n=${String(a.length).padStart(5)}  TB ${f(tb(a)).padStart(6)}  thang ${f((a.filter((x) => x > 0).length / a.length) * 100, 0).padStart(3)}%  PF ${f(PF(a)).padStart(5)} | 2023: ${py("2023").padStart(12)} 2024: ${py("2024").padStart(12)} 2025: ${py("2025").padStart(12)} 2026: ${py("2026").padStart(12)}`);
  }
}

// ---- DANH SACH TIN HIEU DANG CO (nen xac nhan trong ~15 nen cuoi) va chi tiet 1 ma: node ... --hom-nay [MA] ----
if (process.argv.includes("--hom-nay")) {
  const gioStr = (t) => new Date((t + 7 * 3600) * 1000).toISOString().slice(0, 16).replace("T", " ");
  console.log("\n=== TIN HIEU DANG CO (xac nhan trong 15 nen 1 gio cuoi) ===");
  for (const ten of ["V (PK-RSI + hinh chu V)", "PK-RSI", "PK-MACD"]) {
    const ds = SIG[ten].filter((e) => e.d.n - 1 - e.i <= 15);
    console.log(`\n  ${ten}: ${ds.length}`);
    for (const e of ds.sort((a, b) => b.i - a.i)) {
      const d = e.d, r = rsi(d.c);
      console.log(`    ${e.ma.padEnd(5)} xac nhan ${gioStr(h1[e.ma].t[e.i])} | day ${d.l[e.p]} (${gioStr(h1[e.ma].t[e.p])}) RSI ${f(r[e.p], 1)} | gia hien tai ${d.c[d.n - 1]} (+${f((d.c[d.n - 1] / d.l[e.p] - 1) * 100, 1)}% so day)`);
    }
  }
  const ma = process.argv[process.argv.indexOf("--hom-nay") + 1];
  if (ma && h1[ma]) {
    const x = h1[ma], n = x.t.length, r = rsi(x.c), mh = macdH(x.c);
    console.log(`\n=== ${ma}: cac day 1 gio gan day (pivot 3 nen) ===`);
    for (let p = Math.max(3, n - 160); p < n - 3; p++) {
      let ok = true; for (let k = 1; k <= 3; k++) if (!(x.l[p] < x.l[p - k] && x.l[p] <= x.l[p + k])) { ok = false; break; }
      if (ok) console.log(`  ${gioStr(x.t[p])} day ${x.l[p]} RSI ${f(r[p], 1)} MACDh ${f(mh[p], 3)}`);
    }
    console.log(`  Hien tai ${gioStr(x.t[n - 1])} gia ${x.c[n - 1]} RSI ${f(r[n - 1], 1)}`);
    const ct = SIG["PK-RSI"].concat(SIG["V (PK-RSI + hinh chu V)"], SIG["PK-MACD"]).filter((e) => e.ma === ma && e.d.n - 1 - e.i <= 80);
    for (const e of ct) console.log(`  tin hieu: xac nhan ${gioStr(x.t[e.i])}, day ${x.l[e.p]} (${Object.entries(SIG).find(([, a]) => a.includes(e))[0]})`);
  }
}
