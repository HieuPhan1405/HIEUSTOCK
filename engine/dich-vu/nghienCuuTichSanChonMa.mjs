// TICH SAN: MUA KHI HOANG LOAN + DINH GIA RE, VA CHON MA TOT NHAT (Hieu 02/11/2026). Chay tu 2022 (bao cao tai chinh bctc_dai.json co tu 2020-12, TTM tu 2021-09).
// Loc thoi diem (khong nhin truoc): bao cao co hieu luc sau quy + 50 ngay; gia dieu chinh x so CP HIEN TAI = von hoa xap xi (bo qua phat hanh them), PE = von hoa / LNST TTM, PB = von hoa / VCSH.
// Bo loc: LNST TTM > 0, ROE >= 12%, PE <= 15, PB <= 3, LNST quy gan nhat khong giam so cung ky, don bay No/VCSH <= 3 (bo qua NH/CK/BH), von hoa >= 2.000 ty, GTGD TB20 >= 5 ty.
// Xep hang: loi suat loi nhuan (1/PE) + ROE (xep hang trung binh). Top 10. Mua tai dong cua phien SAU ngay tin hieu (cuoi thang). So voi VN-Index va TB deu cac ma thanh khoan.
// Chay: node engine/dich-vu/nghienCuuTichSanChonMa.mjs
import { docJson, tb, f } from "./backtestChung.mjs";
import { SO_CP_LUU_HANH } from "../../lib/soCoPhieuLuuHanh.js";
import { TAM_LY_LICH_SU } from "../../lib/tamLyLichSuDuLieu.js";

const vni = docJson("vnindex_dai.json");
const nen = docJson("nen_dai.json");
const bctc = docJson("bctc_dai.json");
const nganh = docJson("nganh_map.json");
const ngay = vni.map((b) => b.t);
const N = ngay.length;
const idx = new Map(ngay.map((t, i) => [t, i]));
const tl = new Array(N).fill(null);
TAM_LY_LICH_SU.t.forEach((t, k) => {
  const i = idx.get(t);
  if (i != null) tl[i] = TAM_LY_LICH_SU.s[k];
});
const ma = [], C = [], G = [];
for (const [k, bars] of Object.entries(nen)) {
  if (bars.length < 260 || !SO_CP_LUU_HANH[k] || !bctc[k]) continue;
  const c = new Array(N).fill(null), g = new Array(N).fill(0);
  for (const b of bars) {
    const i = idx.get(b.t);
    if (i != null) { c[i] = b.c; g[i] = b.c * b.v; }
  }
  let last = null;
  for (let i = 0; i < N; i++) { if (c[i] != null) last = c[i]; else if (last != null) c[i] = last; }
  ma.push(k); C.push(c); G.push(g);
}
const M = ma.length;
const cong = (d, n) => new Date(Date.parse(d) + n * 86400e3).toISOString().slice(0, 10);
const qsAll = [...new Set(ma.flatMap((k) => Object.keys(bctc[k].q)))].sort();
const lui = (q, k) => qsAll[qsAll.indexOf(q) - k];
const gt = (b, q, it) => b.q[q]?.[it];
const ttm = (b, q, it) => {
  let s = 0;
  for (let k = 0; k < 4; k++) { const x = gt(b, lui(q, k), it); if (!Number.isFinite(x)) return NaN; s += x; }
  return s;
};
const quyHieuLuc = (t) => { let q = null; for (const x of qsAll) { if (cong(x, 50) <= t) q = x; else break; } return q; };
const cache = new Map();
function coBan(j, q) {
  const key = j + "|" + q;
  if (cache.has(key)) return cache.get(key);
  const b = bctc[ma[j]];
  const q4 = lui(q, 4);
  const ln = ttm(b, q, 23003);
  const vcsh = (gt(b, q, 14000) ?? NaN) + (gt(b, q, 15000) ?? 0);
  const no = Number.isFinite(gt(b, q, 13000)) ? gt(b, q, 13000) : NaN;
  const lq = gt(b, q, 23003), lq0 = q4 ? gt(b, q4, 23003) : NaN;
  const o = { ln, vcsh, roe: (ln / vcsh) * 100, donBay: no / vcsh, quyKhongGiam: Number.isFinite(lq) && Number.isFinite(lq0) ? lq >= lq0 : null, loai: b.loai };
  cache.set(key, o);
  return o;
}
const tb20 = (j, i) => { let s = 0; for (let k = i - 19; k <= i; k++) s += G[j][k]; return s / 20; };
function loc(i, t, chat = true) {
  const q = quyHieuLuc(t);
  if (!q) return [];
  const kq = [];
  for (let j = 0; j < M; j++) {
    if (C[j][i] == null || C[j][i - 130] == null || tb20(j, i) < 5e6) continue;
    const cb = coBan(j, q);
    const von = C[j][i] * 1000 * SO_CP_LUU_HANH[ma[j]];
    if (!(cb.ln > 0) || von < 2e12) continue;
    const pe = von / cb.ln, pb = von / cb.vcsh;
    if (!Number.isFinite(pe) || !Number.isFinite(pb)) continue;
    if (chat) {
      if (cb.roe < 12 || pe > 15 || pb > 3 || cb.quyKhongGiam === false) continue;
      if (cb.loai === "pi" && cb.donBay > 3) continue;
    }
    kq.push({ j, pe, pb, roe: cb.roe, von });
  }
  return kq;
}
const xepTop = (ds, n = 10) => {
  const a = [...ds].sort((x, y) => x.pe - y.pe);
  const ra = new Map(a.map((x, r) => [x.j, r]));
  const b = [...ds].sort((x, y) => y.roe - x.roe);
  const rb = new Map(b.map((x, r) => [x.j, r]));
  return ds.map((x) => ({ ...x, d: ra.get(x.j) + rb.get(x.j) })).sort((x, y) => x.d - y.d).slice(0, n);
};

const cuoiThang = [];
for (let i = 0; i < N; i++) if (i === N - 1 || ngay[i].slice(0, 7) !== ngay[i + 1].slice(0, 7)) cuoiThang.push(i);
const R = cuoiThang.filter((i) => ngay[i] >= "2022-01-01" && i + 2 < N);
const cuoiH = (i0, h) => { const p = cuoiThang.indexOf(i0) + h; return p < cuoiThang.length ? cuoiThang[p] : null; };
const sauH = (i0, h) => { const e = cuoiH(i0, h); return e == null ? null : Math.min(N - 1, e + 1); };
const retH = (j, i0, h) => { const e = sauH(i0, h); return e == null ? null : C[j][e] / C[j][i0 + 1] - 1; };
const vH = (i0, h) => { const e = sauH(i0, h); return e == null ? null : vni[e].c / vni[i0 + 1].c - 1; };

const hang = R.map((i0) => ({ i0, top: xepTop(loc(i0, ngay[i0], true)), nLoc: loc(i0, ngay[i0], true).length, nTC: loc(i0, ngay[i0], false).length }));
console.log(`=== Bo loc "chat luong + gia re" tu ${ngay[R[0]]} den ${ngay[R.at(-1)]} (${R.length} thang cuoi thang) ===`);
console.log("So ma dat bo loc moi thang TB", f(tb(hang.map((h) => h.nLoc)), 1), "/ so ma thanh khoan co BCTC:", f(tb(hang.map((h) => h.nTC)), 0));
const hoangLoan = (i0) => { for (let k = i0 - 9; k <= i0; k++) if (tl[k] != null && tl[k] < 20) return true; return false; };

function tongHop(ten, sub, hs) {
  for (const h of hs) {
    const tp = [], vn = [], tc = [];
    for (const o of sub) {
      if (!o.top.length) continue;
      const r1 = o.top.map((x) => retH(x.j, o.i0, h)).filter((x) => x != null);
      if (r1.length < o.top.length * 0.8) continue;
      const ds = loc(o.i0, ngay[o.i0], false).map((x) => retH(x.j, o.i0, h)).filter((x) => x != null);
      tp.push(tb(r1) * 100); vn.push(vH(o.i0, h) * 100); tc.push(tb(ds) * 100);
    }
    if (!tp.length) { console.log(`${ten.padEnd(12)} +${String(h).padStart(2)}T: khong du du lieu`); continue; }
    const hon = tp.filter((x, k) => x > vn[k]).length;
    console.log(`${ten.padEnd(12)} +${String(h).padStart(2)}T n=${String(tp.length).padStart(2)}: top10 ${f(tb(tp), 1).padStart(6)}% | TB deu ${f(tb(tc), 1).padStart(6)}% | VN-Index ${f(tb(vn), 1).padStart(6)}% | top10 > VN-Index ${hon}/${tp.length}`);
  }
}
console.log("\nLoi suat TB sau khi mua (mua phien sau cuoi thang, giu h thang), theo trang thai thi truong; hoang loan = tam ly < 20 trong 10 phien truoc cuoi thang:");
tongHop("TAT CA", hang, [1, 3, 6, 12]);
console.log(`Cac thang hoang loan: ${hang.filter((o) => hoangLoan(o.i0)).map((o) => ngay[o.i0].slice(0, 7)).join(" ") || "khong"}`);
tongHop("HOANG LOAN", hang.filter((o) => hoangLoan(o.i0)), [3, 6, 12]);
tongHop("binh thuong", hang.filter((o) => !hoangLoan(o.i0)), [3, 6, 12]);

// duong cong tai co cau hang thang
const gtTop = [], gtTC = [], gtV = [];
let truoc = null;
for (let r = 0; r + 1 < R.length; r++) {
  const o = hang[r], i0 = R[r], i1 = R[r + 1];
  const ds = o.top.map((x) => x.j);
  const rr = ds.length ? tb(ds.map((j) => C[j][i1 + 1] / C[j][i0 + 1] - 1)) : 0;
  const doi = truoc ? 1 - ds.filter((j) => truoc.includes(j)).length / Math.max(1, ds.length) : 1;
  gtTop.push(rr - 0.004 * doi);
  truoc = ds;
  gtTC.push(tb(loc(i0, ngay[i0], false).map((x) => C[x.j][i1 + 1] / C[x.j][i0 + 1] - 1)));
  gtV.push(vni[i1 + 1].c / vni[i0 + 1].c - 1);
}
const duong = (a) => { const o = [1]; for (const x of a) o.push(o.at(-1) * (1 + x)); return o; };
const cagr = (a) => (Math.pow(duong(a).at(-1), 12 / a.length) - 1) * 100;
const sut = (a) => { let pk = 1, v = 1, m = 0; for (const x of a) { v *= 1 + x; pk = Math.max(pk, v); m = Math.min(m, v / pk - 1); } return m * 100; };
console.log(`\nTai co cau hang thang ${gtTop.length} thang: top10 loc CAGR ${f(cagr(gtTop), 1)}% sut ${f(sut(gtTop), 0)}% | TB deu CAGR ${f(cagr(gtTC), 1)}% sut ${f(sut(gtTC), 0)}% | VN-Index CAGR ${f(cagr(gtV), 1)}% sut ${f(sut(gtV), 0)}%`);
const nam = [...new Set(R.slice(0, -1).map((i) => ngay[i].slice(0, 4)))];
for (const y of nam) {
  const q = R.slice(0, -1).map((i, k) => (ngay[i].startsWith(y) ? k : -1)).filter((k) => k >= 0);
  const g = (a) => (duong(q.map((k) => a[k])).at(-1) - 1) * 100;
  console.log(y, `top10 ${f(g(gtTop), 0).padStart(4)}% | TB deu ${f(g(gtTC), 0).padStart(4)}% | VN-Index ${f(g(gtV), 0).padStart(4)}%`);
}

const dem = new Map();
for (const o of hang) for (const x of o.top) dem.set(ma[x.j], (dem.get(ma[x.j]) || 0) + 1);
console.log("\nMa vao top10 nhieu thang nhat tu 2022:", [...dem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => `${k}(${v}/${hang.length})`).join(" "));

// danh sach hien tai
const iNow = N - 1;
const tNow = ngay[iNow];
let iGia = iNow;
while (iGia > 0 && nen.FPT.at(-1).t < ngay[iGia]) iGia--;
const dinh252 = (j) => { let m = 0; for (let k = Math.max(0, iGia - 251); k <= iGia; k++) if (C[j][k] != null) m = Math.max(m, C[j][k]); return m; };
const now = xepTop(loc(iGia, tNow, true), 20);
console.log(`\n=== TOP 20 HIEN TAI: bao cao hieu luc quy ${quyHieuLuc(tNow)}; gia den ${ngay[iGia]}; ${loc(iGia, tNow, true).length} ma dat bo loc ===`);
for (const x of now) {
  const k = ma[x.j], g = C[x.j][iGia];
  console.log(`${k.padEnd(5)} ${String(nganh[k] ?? "").padEnd(18).slice(0, 18)} PE ${f(x.pe, 1).padStart(5)} PB ${f(x.pb, 2).padStart(5)} ROE ${f(x.roe, 1).padStart(5)}% von ${f(x.von / 1e12, 1).padStart(6)}k ty | cach dinh 1 nam ${f((g / dinh252(x.j) - 1) * 100, 0)}%`);
}
console.log("\nTam ly hien tai (3 ty le, ngay cuoi lich su):", tl.filter((x) => x != null).at(-1), "| ngay", ngay[tl.map((x, i) => (x != null ? i : -1)).filter((i) => i >= 0).at(-1)]);

// ---- PHAN 2: mua deu / chi mua thang hoang loan tung ma tu 2022 (NHIN LAI - chi de xem ma nao "tich" tot nhat, khong phai bang chung chon ma)
const dcaMa = (j, dk) => {
  let don = 0, von = 0;
  for (const i0 of R) { if (!dk(i0) || C[j][i0 + 1] == null) continue; don += 1 / C[j][i0 + 1]; von++; }
  return von ? { boi: (don * C[j][iGia]) / von, von } : null;
};
const dcaV = (dk) => { let don = 0, von = 0; for (const i0 of R) { if (!dk(i0)) continue; don += 1 / vni[i0 + 1].c; von++; } return (don * vni[iGia].c) / von; };
const hl = (i) => hoangLoan(i);
const dsMa = [];
for (let j = 0; j < M; j++) {
  if (C[j][R[0] - 130] == null || tb20(j, iGia) < 5e6 || C[j][iGia] * 1000 * SO_CP_LUU_HANH[ma[j]] < 5e12) continue; // von hoa >= 5.000 ty, con thanh khoan
  const a = dcaMa(j, () => true), b = dcaMa(j, hl);
  if (!a || !b) continue;
  let pk = 0, dd = 0; for (let k = R[0] + 1; k <= iGia; k++) { pk = Math.max(pk, C[j][k]); dd = Math.min(dd, C[j][k] / pk - 1); }
  dsMa.push({ k: ma[j], deu: a.boi, hoang: b.boi, dd: dd * 100 });
}
console.log(`\n=== PHAN 2 (NHIN LAI): von hoa >= 5.000 ty, ${dsMa.length} ma | mua deu moi thang tu 2022-01 den ${ngay[iGia]}: gia tri / von (VN-Index deu: x${f(dcaV(() => true), 2)}; chi mua thang hoang loan x${f(dcaV(hl), 2)}) ===`);
console.log("TB mua deu cac ma x" + f(tb(dsMa.map((x) => x.deu)), 2), "| TB chi mua thang hoang loan x" + f(tb(dsMa.map((x) => x.hoang)), 2), "| ma hon VN-Index (deu):", dsMa.filter((x) => x.deu > dcaV(() => true)).length + "/" + dsMa.length);
for (const x of [...dsMa].sort((a, b) => b.deu - a.deu).slice(0, 15)) console.log(`${x.k.padEnd(5)} deu x${f(x.deu, 2)} | chi thang hoang loan x${f(x.hoang, 2)} | sut toi da ${f(x.dd, 0)}%`);
const topSut = [...dsMa].sort((a, b) => b.dd - a.dd).slice(0, 8).map((x) => `${x.k}(${f(x.deu, 2)}, sut ${f(x.dd, 0)}%)`).join(" ");
console.log("Ma sut nong nhat:", topSut);

// ---- PHAN 3: "TICH SAN" DUNG NGHIA (Hieu: dn lon, kho pha san, tang truong on): von hoa >= 20.000 ty, LNST duong, ROE >= 12%, LNST TTM tang >= 5% so cung ky (neu chua du du lieu: quy tang), CFO TTM > 0 va don bay No/VCSH <= 2,5 va thanh toan hien hanh >= 1 (doanh nghiep phi tai chinh; NH/CK/BH chi xet LNST, ROE, tang truong). Rank theo von hoa, lay 15 ma, chia deu.
function loc3(i, t, gioiHanVon = 2e13) {
  const q = quyHieuLuc(t); if (!q) return [];
  const q4 = lui(q, 4);
  const kq = [];
  for (let j = 0; j < M; j++) {
    if (C[j][i] == null || C[j][i - 130] == null || tb20(j, i) < 5e6) continue;
    const b = bctc[ma[j]];
    const cb = coBan(j, q);
    const von = C[j][i] * 1000 * SO_CP_LUU_HANH[ma[j]];
    if (!(cb.ln > 0) || von < gioiHanVon || cb.roe < 12) continue;
    const ln0 = q4 ? ttm(b, q4, 23003) : NaN;
    const tang = Number.isFinite(ln0) && ln0 > 0 ? cb.ln / ln0 - 1 : cb.quyKhongGiam ? 0.05 : -1;
    if (tang < 0.05) continue;
    if (b.loai === "pi") {
      const cfo = ttm(b, q, 32000), tsnh = gt(b, q, 11000), nnh = gt(b, q, 13100);
      if (!(cfo > 0) || cb.donBay > 2.5 || !(tsnh / nnh >= 1)) continue;
    }
    kq.push({ j, von, roe: cb.roe, tang, pe: von / cb.ln, pb: von / cb.vcsh });
  }
  return kq.sort((a, b) => b.von - a.von).slice(0, 15);
}
console.log("\n=== PHAN 3: TICH SAN DUNG NGHIA (von hoa >= 20.000 ty, LN tang, ROE >= 12%, an toan tai chinh) - 15 ma lon nhat dat bo loc, chia deu, tai co cau hang thang ===");
const g3 = [], rv3 = [];
let tr3 = null; const soMa3 = [];
for (let r = 0; r + 1 < R.length; r++) {
  const i0 = R[r], i1 = R[r + 1];
  const ds = loc3(i0, ngay[i0]).map((x) => x.j); soMa3.push(ds.length);
  const rr = ds.length ? tb(ds.map((j) => C[j][i1 + 1] / C[j][i0 + 1] - 1)) : 0;
  const doi = tr3 ? 1 - ds.filter((j) => tr3.includes(j)).length / Math.max(1, ds.length) : 1;
  g3.push(rr - 0.004 * doi); tr3 = ds; rv3.push(ds.length ? rr : null);
}
console.log(`So ma dat bo loc TB ${f(tb(soMa3), 1)}/thang (toi thieu ${Math.min(...soMa3)}); CAGR ${f(cagr(g3), 1)}% sut ${f(sut(g3), 0)}% | VN-Index CAGR ${f(cagr(gtV), 1)}% sut ${f(sut(gtV), 0)}% | top10 re (phan 1) CAGR ${f(cagr(gtTop), 1)}% sut ${f(sut(gtTop), 0)}%`);
for (const y of nam) { const q = R.slice(0, -1).map((i, k) => (ngay[i].startsWith(y) ? k : -1)).filter((k) => k >= 0); const g = (a) => (duong(q.map((k) => a[k])).at(-1) - 1) * 100; console.log(y, `tich san dung nghia ${f(g(g3), 0).padStart(4)}% | VN-Index ${f(g(gtV), 0).padStart(4)}%`); }
for (const h of [6, 12]) { const tp = [], vn = []; for (const o of hang) { const ds = loc3(o.i0, ngay[o.i0]); const r1 = ds.map((x) => retH(x.j, o.i0, h)).filter((x) => x != null); if (r1.length < 5 || vH(o.i0, h) == null) continue; tp.push(tb(r1) * 100); vn.push(vH(o.i0, h) * 100); } console.log(`+${h}T: TB ${f(tb(tp), 1)}% vs VN-Index ${f(tb(vn), 1)}% | hon VN-Index ${tp.filter((x, k) => x > vn[k]).length}/${tp.length} thang`); }
const dem3 = new Map(); for (const i0 of R) for (const x of loc3(i0, ngay[i0])) dem3.set(ma[x.j], (dem3.get(ma[x.j]) || 0) + 1);
console.log("Ma o lai trong rổ nhieu thang nhat:", [...dem3.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => `${k}(${v})`).join(" "));
const hn = loc3(iGia, tNow);
console.log(`\nDANH SACH HIEN TAI (${hn.length} ma dat bo loc; gia den ${ngay[iGia]}):`);
for (const x of hn) { const k = ma[x.j], g = C[x.j][iGia]; console.log(`${k.padEnd(5)} ${String(nganh[k] ?? "").padEnd(18).slice(0, 18)} von ${f(x.von / 1e12, 0).padStart(4)}k ty | PE ${f(x.pe, 1).padStart(5)} PB ${f(x.pb, 2).padStart(5)} | ROE ${f(x.roe, 1).padStart(5)}% | LN TTM ${x.tang >= 0 ? "+" : ""}${f(x.tang * 100, 0)}% | cach dinh 1 nam ${f((g / dinh252(x.j) - 1) * 100, 0)}%`); }
