// DIEM B TREN KHUNG TUAN (Hieu 2026-10-21: "hay thu dung khung tuan"). Gop nen ngay thanh nen tuan (thu 2 - thu 6), diem B tuan:
//   tuan w dong cua tren Tenkan va Kijun TUAN (ca hai bo thong so: V1 = 9/17 tuan; V2 = 5/9 tuan nhanh hon), day thap nhat 8 tuan cach nen w >= 2 tuan, GTGD TB 4 tuan (gia tri / ngay) >= 3 ty,
//   boi canh da giam: muc giam = giam sau nhat trong 4 tuan gan nhat (w-3..w) tinh tu dinh (high cao nhat) L tuan truoc moi tuan do (L = 4 / 8 / 13 / 26 tuan), moi nhip hoi 1 lan (cach nhau >= 6 tuan, tinh tren moi diem B giam >= 10%).
// Vao lenh: MO CUA phien dau tuan ke tiep (thuc te: biet diem B sau khi dong cua tuan, mua dau tuan sau), phi 0,4%. Do: lai sau 4 / 8 tuan (dong cua tuan w+4 / w+8 so voi gia vao), ty le thang, THUNG DAY (low trong 8 tuan sau < day 8 tuan truoc). Chia toan bo / tu 2022-05.
// CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuDiemBKhungTuan.mjs
import { docJson } from "./backtestChung.mjs";

const cache = docJson("nen_dai.json");
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const th = (x) => (x.length ? (x.filter((y) => y > 0).length / x.length) * 100 : NaN);
const hh = (a, i, n) => { let m = -Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] > m) m = a[j]; return m; };
const ll = (a, i, n) => { let m = Infinity; for (let j = Math.max(0, i - n + 1); j <= i; j++) if (a[j] < m) m = a[j]; return m; };
const CP = 0.4;

function thanhTuan(b) {
  const w = []; let khoa = null;
  for (const x of b) {
    const d = new Date(x.t + "T00:00:00Z"); const dow = (d.getUTCDay() + 6) % 7; const k = new Date(d.getTime() - dow * 86400000).toISOString().slice(0, 10);
    if (k !== khoa) { w.push({ t: x.t, o: x.o, h: x.h, l: x.l, c: x.c, gt: x.c * x.v / 1e6, n: 1 }); khoa = k; }
    else { const q = w[w.length - 1]; q.h = Math.max(q.h, x.h); q.l = Math.min(q.l, x.l); q.c = x.c; q.t = x.t; q.gt += x.c * x.v / 1e6; q.n++; }
  }
  return w;
}
const BO = { V1: [9, 17], V2: [5, 9] };
const DS_L = [4, 8, 13, 26];
const ev = {}; for (const bo of Object.keys(BO)) for (const L of DS_L) ev[`${bo}_L${L}`] = [];
for (const ma of Object.keys(cache)) {
  const b = cache[ma]; if (!b || b.length < 400) continue;
  const w = thanhTuan(b); const n = w.length; if (n < 80) continue;
  const o = w.map((x) => x.o), c = w.map((x) => x.c), h = w.map((x) => x.h), l = w.map((x) => x.l);
  const ult = {};
  for (let i = 40; i < n - 9; i++) {
    if (w[i].n < 3) continue; // bo tuan thieu phien (le)
    let gt = 0; for (let j = i - 3; j <= i; j++) gt += w[j].gt; if (gt / 20 < 3) continue;
    const day = ll(l, i, 8); let kDay = i; for (let j = i - 7; j <= i; j++) if (l[j] <= day) kDay = j;
    if (i - kDay < 2) continue;
    for (const [bo, [pt, pk]] of Object.entries(BO)) {
      const tk = (hh(h, i, pt) + ll(l, i, pt)) / 2, kj = (hh(h, i, pk) + ll(l, i, pk)) / 2;
      if (!(c[i] > tk && c[i] > kj)) continue;
      for (const L of DS_L) {
        const key = `${bo}_L${L}`;
        if (i - (ult[key] ?? -99) < 6) continue;
        let giam = 0; for (let k = 0; k <= 3; k++) giam = Math.max(giam, (1 - c[i - k] / hh(h, i - k, L)) * 100);
        if (giam < 10) continue;
        ult[key] = i;
        const E2 = o[i + 1]; let m8 = Infinity; for (let j = i + 1; j <= i + 8; j++) m8 = Math.min(m8, l[j]);
        ev[key].push({ ky: w[i].t < "2022-05-01" ? 0 : 1, giam, thung: m8 < day, r4: (c[i + 4] / E2 - 1) * 100 - CP, r8: (c[i + 8] / E2 - 1) * 100 - CP });
      }
    }
  }
}
const NHOM = [[10, 15], [15, 20], [20, 30], [30, 40], [40, 999]];
const dong = (ten, a) => a.length < 25
  ? console.log(`    ${ten.padEnd(9)} n=${String(a.length).padStart(5)} (it mau)`)
  : console.log(`    ${ten.padEnd(9)} n=${String(a.length).padStart(5)} | thung day ${f((a.filter((x) => x.thung).length / a.length) * 100, 0).padStart(3)}% | 4 tuan ${f(tb(a.map((x) => x.r4)), 2).padStart(6)} (thang ${f(th(a.map((x) => x.r4)), 0)}%) | 8 tuan ${f(tb(a.map((x) => x.r8)), 2).padStart(6)} (thang ${f(th(a.map((x) => x.r8)), 0)}%)`);
for (const key of Object.keys(ev)) {
  console.log(`\n== ${key} (${key.startsWith("V1") ? "Tenkan 9 / Kijun 17 tuan" : "Tenkan 5 / Kijun 9 tuan"}; giam tu dinh ${key.split("L")[1]} tuan): ${ev[key].length} diem B`);
  for (const [tk, loc] of [["toan bo", () => true], ["TU 2022-05", (x) => x.ky === 1]]) {
    console.log(`   - ${tk}`);
    for (const [lo, hi] of NHOM) dong(hi === 999 ? `>= ${lo}%` : `${lo}-${hi}%`, ev[key].filter((x) => loc(x) && x.giam >= lo && x.giam < hi));
  }
}
