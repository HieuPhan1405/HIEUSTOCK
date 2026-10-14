// NGHIEN CUU (2026-10-15): lenh MUA luc co phieu dang DI NGANG trong kenh gia (range) co hay lo hon khong? (vi du PLX 17/08/2026: kenh 35,0 - 38,3 keo dai ~3 thang, MUA giua kenh, TP1 nam tren dinh kenh)
// Do "di ngang" tai phien tin hieu bang du lieu truoc do (khong nhin truoc): (1) he so hieu qua Kaufman 60 phien = |dong cua - dong cua 60 phien truoc| / tong |bien dong| (thap = di ngang, nhieu rang cua),
// (2) do rong kenh 60 phien = (cao nhat - thap nhat) / thap nhat, (3) so lan cat duong giua kenh 60 phien (nhieu = giang co), (4) TP1 nam tren dinh 60 phien bao nhieu % (can pha vo moi chot duoc).
// Mua mo cua phien sau, thoat theo luat he thong, phi 0,4% / vong. Chay: node engine/dich-vu/nghienCuuDiNgang.mjs
import { taiLenh, mo, tb, f } from "./nghienCuuLenh.mjs";
const { lenh } = taiLenh();
const ds = [];
for (const t of lenh) {
  const iv = t.iv, E = t.open[iv + 1]; if (!(E > 0) || !(t.S < E) || iv < 130) continue;
  const r = mo(t, { E, vao: iv + 1, banTu: iv + 3, S: t.S }); if (!r) continue;
  const W = 60, c = t.close; let hh = -Infinity, ll = Infinity, tong = 0, cat = 0;
  for (let k = iv - W + 1; k <= iv; k++) { hh = Math.max(hh, t.high[k]); ll = Math.min(ll, t.low[k]); if (k > iv - W + 1) tong += Math.abs(c[k] - c[k - 1]); }
  const mid = (hh + ll) / 2; for (let k = iv - W + 2; k <= iv; k++) if ((c[k] - mid) * (c[k - 1] - mid) < 0) cat++;
  let h120 = -Infinity, l120 = Infinity; for (let k = iv - 119; k <= iv; k++) { h120 = Math.max(h120, t.high[k]); l120 = Math.min(l120, t.low[k]); }
  ds.push({ ret: r.ret, ngay: t.ngay, nam: t.ngay.slice(0, 4), kc: t.ngay >= "2022-05-01", er: Math.abs(c[iv] - c[iv - W]) / tong, rong: (hh / ll - 1) * 100, cat, tp1Tren: (t.tp[0] / hh - 1) * 100, vt: (c[iv] - l120) / (h120 - l120), viTri60: (c[iv] - ll) / (hh - ll) });
}
const R = (g) => g.map((x) => x.ret);
const mota = (g) => `n=${String(g.length).padStart(4)} TB ${f(tb(R(g))).padStart(6)}% thang ${f((100 * g.filter((x) => x.ret > 0).length) / (g.length || 1), 0).padStart(2)}% | truoc 05/2022 ${f(tb(R(g.filter((x) => !x.kc)))).padStart(6)}% | tu 05/2022 ${f(tb(R(g.filter((x) => x.kc)))).padStart(6)}% | 2026 ${f(tb(R(g.filter((x) => x.nam === "2026")))).padStart(6)}% (n${g.filter((x) => x.nam === "2026").length})`;
function ci(tap, fn) {
  const th = [...new Set(tap.map((x) => x.ngay.slice(0, 7)))]; const m = new Map(th.map((k) => [k, [0, 0, 0, 0]]));
  for (const x of tap) { const g = m.get(x.ngay.slice(0, 7)); if (fn(x)) { g[0] += x.ret; g[1]++; } else { g[2] += x.ret; g[3]++; } }
  let seed = 11; const rd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; const kq = [];
  for (let k = 0; k < 2000; k++) { let a = 0, na = 0, b = 0, nb = 0; for (let i = 0; i < th.length; i++) { const g = m.get(th[Math.floor(rd() * th.length)]); a += g[0]; na += g[1]; b += g[2]; nb += g[3]; } if (na && nb) kq.push(a / na - b / nb); }
  kq.sort((x, y) => x - y); const A = tap.filter(fn), B = tap.filter((x) => !fn(x)); return `${f(tb(R(A)) - tb(R(B)))}% [${f(kq[50])} .. ${f(kq[1950])}]`;
}
const ss = (ten, fn, tap = ds) => { console.log(`   ${ten.padEnd(52)} CO   ${mota(tap.filter(fn))}`); console.log(`   ${"".padEnd(52)} KHONG ${mota(tap.filter((x) => !fn(x)))}`); console.log(`   ${"".padEnd(52)} -> chenh (co - khong) ${ci(tap, fn)}`); };
console.log(`Tong ${ds.length} lenh. Moc: ${mota(ds)}`);
console.log("\n== 1. HE SO HIEU QUA 60 PHIEN (thap = di ngang) ==");
for (const ng of [0.1, 0.15, 0.2, 0.3]) ss(`Hieu qua < ${ng} (di ngang, nhieu rang cua)`, (x) => x.er < ng);
console.log("\n== 2. DO RONG KENH 60 PHIEN ==");
for (const ng of [12, 15, 20, 25]) ss(`Kenh hep < ${ng}%`, (x) => x.rong < ng);
console.log("\n== 3. SO LAN CAT DUONG GIUA KENH (60 phien) ==");
for (const ng of [8, 10, 12]) ss(`Cat duong giua >= ${ng} lan (giang co)`, (x) => x.cat >= ng);
console.log("\n== 4. TP1 NAM TREN DINH 60 PHIEN BAO NHIEU % (can pha vo kenh) ==");
for (const ng of [0, 2, 4]) ss(`TP1 cao hon dinh 60 phien tu ${ng}% (can bat ra khoi kenh)`, (x) => x.tp1Tren >= ng);
console.log("\n== 5. KET HOP: di ngang + mua GIUA kenh (vi tri 60 phien 0,3-0,7) ==");
ss("Di ngang (hieu qua < 0,2) VA mua giua kenh", (x) => x.er < 0.2 && x.viTri60 >= 0.3 && x.viTri60 <= 0.7);
ss("Di ngang (hieu qua < 0,2) VA mua sat dinh kenh (>= 0,8)", (x) => x.er < 0.2 && x.viTri60 >= 0.8);
console.log("\n== 6. SAU KHI BIET vi tri trong bien do 120 phien (>= 0,8), di ngang con them gi khong? ==");
ss("[vi tri >= 0,8] hieu qua < 0,2", (x) => x.er < 0.2, ds.filter((x) => x.vt >= 0.8));
ss("[vi tri < 0,8] hieu qua < 0,2", (x) => x.er < 0.2, ds.filter((x) => x.vt < 0.8));
ss("[vi tri < 0,8] kenh hep < 15%", (x) => x.rong < 15, ds.filter((x) => x.vt < 0.8));
process.exit(0);
