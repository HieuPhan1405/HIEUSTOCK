// BAT PHUC HOI SAU PHA GIAM DAI HAN (Hieu 2026-10-21: "cai nao oki nhat de bat cac diem hoi sau pha giam dai han - BDS, CK, thep giam rat lau roi").
// Nhom co phieu DAI HAN GIAM: dong cua <= 65% dinh 250 phien VA dinh do cach nay >= 100 phien, GTGD TB20 >= 3 ty. Thu cac DIEU KIEN VAO LENH (moi cai dedupe 20 phien/ma, mua MO CUA phien sau, phi 0,4%):
//  T1 diem B ngay (dong cua tren Tenkan 9 + Kijun 17, day 20 phien cach >= 3 phien)
//  T2 vuot MA50 lan dau (>= 30 / 40 phien truoc nam duoi MA50)
//  T3 pha vo vung tich luy 40 phien (dong cua > dinh 40 phien truoc, bien do vung <= 35%, KL >= 1,5x TB20)
//  T4 day sau cao hon day truoc (day 30 phien > day 30 phien truoc do) + dong cua tren Tenkan va Kijun
//  T5 MA20 cat len MA50
//  T6 vuot Kijun 85 phien (tuong duong Kijun 17 tuan) lan dau sau >= 40 phien nam duoi
//  T7 tin hieu MUA thuong cua engine (neu khop chi so nen)
// Do: lai 20 / 60 / 120 phien (TB, ty le thang), THUNG DAY (low trong 60 phien sau < day 30 phien truoc), toan bo / truoc 2022-05 / tu 2022-05, va rieng THEP / BDS / CHUNG KHOAN. Doi chieu "co so": moi 10 phien, moi ma thuoc nhom.
// CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuHoiSauGiamDai.mjs
import { docJson, chayEngine } from "./backtestChung.mjs";
import { NGANH } from "../danh-sach/nganh.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const th = (x) => (x.length ? (x.filter((y) => y > 0).length / x.length) * 100 : NaN);
const CP = 0.4;
const nganhSet = (...t) => new Set(t.flatMap((k) => [...(NGANH.get(k) ?? [])]));
const NHOM_NGANH = { THEP: nganhSet("Thep"), BDS: nganhSet("Bat dong san", "BDS Khu cong nghiep"), CK: nganhSet("Chung khoan") };

const ev = {}; const them = (k, e) => (ev[k] ||= []).push(e);
const sysSet = new Set();
try {
  const { lenh } = chayEngine({ cache, vni });
  for (const t of lenh) if (t.loai === 1 && cache[t.ma] && cache[t.ma].length === t.n) sysSet.add(`${t.ma}:${t.iv}`);
} catch (e) { console.log("khong chay duoc engine:", e.message); }

for (const ma of Object.keys(cache)) {
  const b = cache[ma]; if (!b || b.length < 500) continue;
  const n = b.length, o = b.map((x) => x.o), c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), v = b.map((x) => x.v);
  const pre = [0]; for (let i = 0; i < n; i++) pre.push(pre[i] + c[i]);
  const sma = (i, k) => (i + 1 >= k ? (pre[i + 1] - pre[i + 1 - k]) / k : null);
  const ma50 = c.map((_, i) => sma(i, 50)), ma20 = c.map((_, i) => sma(i, 20));
  const ult = {};
  const nganh = Object.entries(NHOM_NGANH).find(([, s]) => s.has(ma))?.[0] ?? "KHAC";
  for (let i = 260; i < n - 121; i++) {
    const d250 = hh(h, i, 250); if (!(c[i] <= 0.65 * d250)) continue;
    let iP = i; for (let j = i - 249; j <= i; j++) if (h[j] === d250) iP = j;
    if (i - iP < 100) continue;
    let gt = 0; for (let j = i - 19; j <= i; j++) gt += (c[j] * v[j]) / 1e6; if (gt / 20 < 3) continue;
    const day30 = ll(l, i, 30), E2 = o[i + 1];
    let m60 = Infinity; for (let j = i + 1; j <= i + 60; j++) m60 = Math.min(m60, l[j]);
    const rec = { nganh, ky: b[i].t < "2022-05-01" ? 0 : 1, thung: m60 < day30, r20: (c[i + 21] / E2 - 1) * 100 - CP, r60: (c[i + 61] / E2 - 1) * 100 - CP, r120: (c[i + 121] / E2 - 1) * 100 - CP };
    const fire = (k) => { if (i - (ult[k] ?? -99) < 20) return; ult[k] = i; them(k, rec); };
    if (i % 10 === 0) them("CO SO (moi 10 phien)", rec);
    const tk = (hh(h, i, 9) + ll(l, i, 9)) / 2, kj = (hh(h, i, 17) + ll(l, i, 17)) / 2;
    const day20 = ll(l, i, 20); let kDay = i; for (let j = i - 19; j <= i; j++) if (l[j] <= day20) kDay = j;
    if (c[i] > tk && c[i] > kj && i - kDay >= 3) fire("T1 diem B ngay");
    if (ma50[i] != null && c[i] > ma50[i] && c[i - 1] <= ma50[i - 1]) { let duoi = 0; for (let j = i - 40; j < i; j++) if (c[j] < ma50[j]) duoi++; if (duoi >= 30) fire("T2 vuot MA50 lan dau"); }
    { const d40 = hh(h, i - 1, 40), t40 = ll(l, i - 1, 40); let s = 0; for (let j = i - 20; j < i; j++) s += v[j]; s /= 20; if (c[i] > d40 && (d40 - t40) / d40 <= 0.35 && s > 0 && v[i] >= 1.5 * s) fire("T3 pha vung tich luy 40p"); }
    if (ll(l, i, 30) > ll(l, i - 30, 30) && c[i] > tk && c[i] > kj) fire("T4 day sau cao hon + tren Tenkan/Kijun");
    if (ma20[i] != null && ma50[i] != null && ma20[i] > ma50[i] && ma20[i - 1] <= ma50[i - 1]) fire("T5 MA20 cat len MA50");
    { const k85 = (hh(h, i, 85) + ll(l, i, 85)) / 2, k85p = (hh(h, i - 1, 85) + ll(l, i - 1, 85)) / 2; if (c[i] > k85 && c[i - 1] <= k85p) { let duoi = 0; for (let j = i - 40; j < i; j++) if (c[j] < (hh(h, j, 85) + ll(l, j, 85)) / 2) duoi++; if (duoi >= 30) fire("T6 vuot Kijun 85p (~Kijun 17 tuan)"); } }
    if (sysSet.has(`${ma}:${i}`)) fire("T7 tin hieu MUA thuong cua engine");
  }
}
const dong = (ten, a) => a.length < 25
  ? console.log(`   ${ten.padEnd(38)} n=${String(a.length).padStart(5)} (it mau)`)
  : console.log(`   ${ten.padEnd(38)} n=${String(a.length).padStart(5)} | thung day ${f((a.filter((x) => x.thung).length / a.length) * 100, 0).padStart(3)}% | 20p ${f(tb(a.map((x) => x.r20)), 2).padStart(6)} (${f(th(a.map((x) => x.r20)), 0)}%) | 60p ${f(tb(a.map((x) => x.r60)), 2).padStart(6)} (${f(th(a.map((x) => x.r60)), 0)}%) | 120p ${f(tb(a.map((x) => x.r120)), 2).padStart(6)} (${f(th(a.map((x) => x.r120)), 0)}%)`);
const THU_TU = ["CO SO (moi 10 phien)", ...Object.keys(ev).filter((k) => k[0] === "T").sort()];
for (const [tenKy, loc] of [["TOAN BO", () => true], ["TRUOC 2022-05", (x) => x.ky === 0], ["TU 2022-05", (x) => x.ky === 1]]) {
  console.log(`\n######## ${tenKy} (lai sau phi, % thang trong ngoac) ########`);
  for (const k of THU_TU) dong(k, (ev[k] ?? []).filter(loc));
}
console.log("\n######## RIENG THEP / BDS / CHUNG KHOAN, TU 2022-05 ########");
for (const ng of ["THEP", "BDS", "CK"]) {
  console.log(` -- ${ng}`);
  for (const k of THU_TU) dong(k, (ev[k] ?? []).filter((x) => x.ky === 1 && x.nganh === ng));
}
