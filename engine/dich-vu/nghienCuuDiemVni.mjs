// NGHIEN CUU (2026-10-14): khi DIEM cua VN-Index thap (cung cong thuc diem nhu tung ma - the PTKT VN-Index o trang Tong quan), cac lenh MUA co hay bi lo khong?
// Diem VN-Index: tinhTinHieuChoMa({ ma: "VNINDEX" }) giong engine/loi/quetToanBo.js. Lenh: lenh MUA goc cua he thong, mua MO CUA phien sau tin hieu, thoat theo luat he thong,
// phi 0,4% / vong (nhu nghienCuuVwapPoc.mjs). Diem VN-Index lay o phien tin hieu (biet truoc khi mua). Khoang tin cay 95% lay mau lai theo CUM THANG.
// Chay: node engine/dich-vu/nghienCuuDiemVni.mjs
import { taiLenh, mo, tb, f } from "./nghienCuuLenh.mjs";
import { docJson } from "./backtestChung.mjs";
import { tinhTinHieuChoMa } from "../tinhTinHieuChoMa.js";
import { NGANH } from "../danh-sach/nganh.js";

const vni = docJson("vnindex_dai.json");
const kqBreadth = { theoNganh: new Map([...NGANH.keys()].map((k) => [k, 50])), trungBinh: 50 };
const hv = tinhTinHieuChoMa({ ma: "VNINDEX", nen: vni, vniClose: vni.map((b) => b.c), san: "HOSE", ketQuaBreadth: kqBreadth, thamSo: { traChuoi: true } });
const diemVni = hv._chuoi.totalScore, giuVni = hv._chuoi.kq.giuTrongVongLap;
const viTri = new Map(vni.map((b, i) => [b.t, i]));
console.log(`Diem VN-Index phien ${vni[vni.length - 1].t}: ${f(diemVni[vni.length - 1])} (web hien: ${hv.diem ?? "-"}, tin ${hv.tin})`);
const cs = vni.map((b) => b.c); const ma = (n) => cs.map((_, i) => (i >= n - 1 ? cs.slice(i - n + 1, i + 1).reduce((s, x) => s + x, 0) / n : null));
const ma50 = ma(50), ma200 = ma(200);

const { lenh } = taiLenh();
const ds = [];
for (const t of lenh) {
  const iv = t.iv, E = t.open[iv + 1];
  if (!(E > 0) || !(t.S < E)) continue;
  const j = viTri.get(t.ngay); if (j == null || diemVni[j] == null || !Number.isFinite(diemVni[j])) continue;
  const r = mo(t, { E, vao: iv + 1, banTu: iv + 3, S: t.S }); if (!r) continue;
  let hh = -Infinity, ll = Infinity; for (let k = iv - 119; k <= iv; k++) { hh = Math.max(hh, t.high[k]); ll = Math.min(ll, t.low[k]); }
  ds.push({ ret: r.ret, ngay: t.ngay, nam: t.ngay.slice(0, 4), kc: t.ngay >= "2022-05-01", d: diemVni[j], dTruoc5: j >= 5 ? diemVni[j - 5] : null, giu: giuVni[j] === 1,
    duoiMa50: cs[j] < ma50[j], duoiMa200: ma200[j] != null && cs[j] < ma200[j], ganDinh: (t.close[iv] - ll) / (hh - ll) >= 0.8 });
}
const R = (g) => g.map((x) => x.ret);
const mota = (g) => `n=${String(g.length).padStart(4)} | TB ${f(tb(R(g))).padStart(6)}% | thang ${f((g.filter((x) => x.ret > 0).length / (g.length || 1)) * 100, 0).padStart(2)}% | truoc 05/2022 ${f(tb(R(g.filter((x) => !x.kc)))).padStart(6)}% | tu 05/2022 ${f(tb(R(g.filter((x) => x.kc)))).padStart(6)}%`;
function chenhThang(tap, fn) {
  const th = [...new Set(tap.map((x) => x.ngay.slice(0, 7)))]; const theo = new Map(th.map((m) => [m, [0, 0, 0, 0]]));
  for (const x of tap) { const g = theo.get(x.ngay.slice(0, 7)); if (fn(x)) { g[0] += x.ret; g[1]++; } else { g[2] += x.ret; g[3]++; } }
  let seed = 777; const rd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const kq = []; for (let k = 0; k < 3000; k++) { let a = 0, na = 0, b = 0, nb = 0; for (let i = 0; i < th.length; i++) { const g = theo.get(th[Math.floor(rd() * th.length)]); a += g[0]; na += g[1]; b += g[2]; nb += g[3]; } if (na && nb) kq.push(a / na - b / nb); }
  kq.sort((x, y) => x - y); const A = tap.filter(fn), B = tap.filter((x) => !fn(x));
  if (A.length < 15 || B.length < 15) return "-";
  return `${f(tb(R(A)) - tb(R(B)))}% [${f(kq[Math.floor(kq.length * 0.025)])} .. ${f(kq[Math.floor(kq.length * 0.975)])}]`;
}
const ss = (ten, fn, tap = ds) => {
  console.log(`   ${ten.padEnd(54)} CO    ${mota(tap.filter(fn))}`);
  console.log(`   ${"".padEnd(54)} KHONG ${mota(tap.filter((x) => !fn(x)))}`);
  console.log(`   ${"".padEnd(54)} -> chenh (co - khong): ${chenhThang(tap, fn)} | truoc 05/2022 ${chenhThang(tap.filter((x) => !x.kc), fn)} | tu 05/2022 ${chenhThang(tap.filter((x) => x.kc), fn)}`);
};

console.log(`\nSo lenh: ${ds.length} | moc: ${mota(ds)}`);
const sx = [...ds].sort((a, b) => a.d - b.d);
console.log("\n=== 1. Chia 5 nhom theo diem VN-Index ngay tin hieu (thap -> cao) ===");
for (let k = 0; k < 5; k++) { const g = sx.slice(Math.floor((k * sx.length) / 5), Math.floor(((k + 1) * sx.length) / 5)); console.log(`   Q${k + 1} diem ${f(g[0].d, 2).padStart(5)} .. ${f(g[g.length - 1].d, 2).padStart(5)}  ${mota(g)}`); }
console.log("\n=== 2. Nguong diem VN-Index ===");
for (const ng of [-1.5, -1, -0.5, 0]) ss(`Diem VN-Index < ${ng}`, (x) => x.d < ng);
ss("Diem VN-Index >= 1,25 (VN-Index tu no dat diem MUA)", (x) => x.d >= 1.25);
ss("VN-Index dang o trang thai giu lenh (MUA / NAM GIU)", (x) => x.giu);
ss("Diem VN-Index dang GIAM (thap hon 5 phien truoc)", (x) => x.dTruoc5 != null && x.d < x.dTruoc5, ds.filter((x) => x.dTruoc5 != null));
console.log("\n=== 3. So voi cac boi canh thi truong don gian ===");
ss("VN-Index duoi MA50", (x) => x.duoiMa50); ss("VN-Index duoi MA200", (x) => x.duoiMa200);
console.log("\n=== 4. Ket hop voi vi tri gia cua chinh ma (20% tren cung bien do 120 phien) ===");
ss("[ma gan dinh] diem VN-Index < 0", (x) => x.d < 0, ds.filter((x) => x.ganDinh));
ss("[ma KHONG gan dinh] diem VN-Index < 0", (x) => x.d < 0, ds.filter((x) => !x.ganDinh));
console.log("\n=== 5. Theo nam: diem VN-Index < 0 | >= 0 (TB %, n) ===");
for (const y of [...new Set(ds.map((x) => x.nam))].sort()) { const a = ds.filter((x) => x.nam === y && x.d < 0), b = ds.filter((x) => x.nam === y && x.d >= 0); console.log(`   ${y}: thap ${f(tb(R(a))).padStart(6)}% (n${String(a.length).padStart(3)}) | cao ${f(tb(R(b))).padStart(6)}% (n${String(b.length).padStart(3)})`); }
process.exit(0);
