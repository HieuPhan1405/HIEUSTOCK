// NGHIEN CUU (2026-10-14): kiem tra bo phan loai "VN-Index so voi vung gia tri 60 phien" DUNG CHINH HAM CUA WEB (lib/volumeProfile.js + lib/vungGiaTriChiSo.js)
// de the tren trang Thi truong noi dung dieu da kiem chung. Lenh: mua mo cua phien sau tin hieu, thoat theo luat he thong, da tru chi phi.
// CI: bootstrap theo CUM THANG (cac lenh cung thang chung 1 thi truong nen khong doc lap).
// Chay: node engine/dich-vu/nghienCuuVPVni.mjs
import { taiLenh, mo, tb, f } from "./nghienCuuLenh.mjs";
import { viTriTheoVungGiaTri } from "../../lib/vungGiaTriChiSo.js";

const { lenh, vni } = taiLenh();
const idx = new Map(vni.map((b, i) => [b.t, i]));
const nho = new Map();
const viTri = (ngay) => {
  if (nho.has(ngay)) return nho.get(ngay);
  const i = idx.get(ngay); const kq = i == null ? null : viTriTheoVungGiaTri(vni.slice(0, i + 1));
  nho.set(ngay, kq); return kq;
};
const ds = [];
for (const t of lenh) {
  const iv = t.iv, E = t.open[iv + 1]; if (!(E > 0) || iv < 130) continue;
  const r = mo(t, { E, vao: iv + 1, banTu: iv + 3, S: t.S }); if (!r) continue;
  const v = viTri(t.ngayArr[iv]); if (!v) continue;
  ds.push({ ret: r.ret, ngay: t.ngayArr[iv], vt: v.viTri });
}
const cumBoot = (a, b) => {
  const th = [...new Set([...a, ...b].map((x) => x.ngay.slice(0, 7)))];
  const G = new Map(th.map((m) => [m, [0, 0, 0, 0]])); for (const x of a) { const g = G.get(x.ngay.slice(0, 7)); g[0] += x.ret; g[1]++; } for (const x of b) { const g = G.get(x.ngay.slice(0, 7)); g[2] += x.ret; g[3]++; }
  let seed = 777; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const kq = []; for (let k = 0; k < 4000; k++) { let s1 = 0, n1 = 0, s2 = 0, n2 = 0; for (let i = 0; i < th.length; i++) { const g = G.get(th[Math.floor(rnd() * th.length)]); s1 += g[0]; n1 += g[1]; s2 += g[2]; n2 += g[3]; } if (n1 && n2) kq.push(s1 / n1 - s2 / n2); }
  kq.sort((x, y) => x - y); return [kq[Math.floor(kq.length * 0.025)], kq[Math.floor(kq.length * 0.975)]];
};
const dong = (ten, g) => console.log(`   ${ten.padEnd(34)} n=${String(g.length).padStart(4)} | TB ${f(tb(g.map((x) => x.ret))).padStart(6)}% | thang ${f((g.filter((x) => x.ret > 0).length / (g.length || 1)) * 100, 0)}%`);
console.log(`=== VN-Index so voi vung gia tri 60 phien - HAM CUA WEB (${ds.length} lenh) ===`);
dong("Tat ca", ds);
for (const k of ["tren", "trong", "duoi"]) dong(`VN-Index ${k.toUpperCase()} vung gia tri`, ds.filter((x) => x.vt === k));
const duoi = ds.filter((x) => x.vt === "duoi"), conLai = ds.filter((x) => x.vt !== "duoi");
const [lo, hi] = cumBoot(conLai, duoi);
console.log(`   chenh (khong duoi - duoi) = ${f(tb(conLai.map((x) => x.ret)) - tb(duoi.map((x) => x.ret)))}% [95% CI theo cum thang ${f(lo)} .. ${f(hi)}]`);
for (const [a, b, ten] of [["2000", "2020", "<= 2019"], ["2020", "2023", "2020-2022"], ["2023", "2099", "2023+"]]) {
  const g1 = conLai.filter((x) => x.ngay >= a && x.ngay < b), g2 = duoi.filter((x) => x.ngay >= a && x.ngay < b);
  console.log(`   ${ten.padEnd(10)}: khong duoi ${f(tb(g1.map((x) => x.ret)))}% (n=${g1.length}) | duoi ${f(tb(g2.map((x) => x.ret)))}% (n=${g2.length}) | chenh ${f(tb(g1.map((x) => x.ret)) - tb(g2.map((x) => x.ret)))}%`);
}
// Ty le thoi gian: bao nhieu % so phien VN-Index o tung trang thai
const dem = { tren: 0, trong: 0, duoi: 0 }; let tong = 0;
for (let i = 200; i < vni.length; i++) { const v = viTri(vni[i].t) ?? viTriTheoVungGiaTri(vni.slice(0, i + 1)); if (v) { dem[v.viTri]++; tong++; } }
console.log(`   Ty le so phien (tu ${vni[200].t}): tren ${f((dem.tren / tong) * 100, 0)}% | trong ${f((dem.trong / tong) * 100, 0)}% | duoi ${f((dem.duoi / tong) * 100, 0)}%`);
const cuoi = viTriTheoVungGiaTri(vni);
console.log(`   Hien tai (${vni[vni.length - 1].t}):`, JSON.stringify(cuoi));
process.exit(0);
