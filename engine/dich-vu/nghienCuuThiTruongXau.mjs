// NGHIEN CUU (2026-10-14): tim dieu kien de LO IT HON khi thi truong xau (nhu hien nay: VN-Index duoi SMA20/50/200, do rong SMA50 ~30%).
// Mau: lenh MUA goc cua he thong (taiLenh), mua MO CUA phien sau, thoat theo luat he thong, phi 0,4% / vong.
// Buoc 1: dinh nghia "thi truong xau" bang chi so BIET TRUOC ngay mua (VN-Index so voi SMA, do rong, sut giam tu dinh, diem VN-Index) va xem lenh luc do ra sao.
// Buoc 2: trong thi truong xau, thu (a) loc lenh theo dac diem cua chinh ma, (b) doi cach thoat. KHAM PHA = lenh truoc 05/2022, KIEM CHUNG = tu 05/2022:
//   chi coi la dang tin khi CA HAI giai doan cung tot hon va khoang tin cay (lay mau lai theo cum thang) khong chua 0.
// Chay: node engine/dich-vu/nghienCuuThiTruongXau.mjs
import { taiLenh, mo, tb, f } from "./nghienCuuLenh.mjs";
import { tinhTinHieuChoMa } from "../tinhTinHieuChoMa.js";
import { NGANH } from "../danh-sach/nganh.js";
import { sma } from "../loi/mang.js";

const { lenh, thiTruong, vni } = taiLenh();
const vc = vni.map((b) => b.c), vt = new Map(vni.map((b, i) => [b.t, i]));
const m20 = sma(vc, 20), m50 = sma(vc, 50), m200 = sma(vc, 200);
const kq0 = { theoNganh: new Map([...NGANH.keys()].map((k) => [k, 50])), trungBinh: 50 };
const diemVni = tinhTinHieuChoMa({ ma: "VNINDEX", nen: vni, vniClose: vc, san: "HOSE", ketQuaBreadth: kq0, thamSo: { traChuoi: true } })._chuoi.totalScore;
const dinh250 = vc.map((_, i) => Math.max(...vc.slice(Math.max(0, i - 249), i + 1)));
const thTruong = (ngay) => {
  const i = vt.get(ngay); if (i == null || m200[i] == null) return null; const tt = thiTruong(ngay);
  return { duoi20: vc[i] < m20[i], duoi50: vc[i] < m50[i], duoi200: vc[i] < m200[i], dr50: tt?.doRong50 ?? null, drK: tt?.doRongKijun ?? null, sut: (vc[i] / dinh250[i] - 1) * 100, diem: diemVni[i], ret20: i >= 20 ? (vc[i] / vc[i - 20] - 1) * 100 : null };
};
{ const i = vni.length - 1, t = vni[i].t, h = thTruong(t); console.log(`Hom nay (${t}): VN-Index ${vc[i]}; duoi SMA20/50/200: ${h.duoi20}/${h.duoi50}/${h.duoi200}; do rong SMA50 ${f(h.dr50, 0)}%; do rong Kijun ${f(h.drK, 0)}%; sut tu dinh 250 phien ${f(h.sut, 1)}%; diem ${f(h.diem)}; tang 20 phien ${f(h.ret20, 1)}%`); }

const ds = [];
for (const t of lenh) {
  const iv = t.iv, E = t.open[iv + 1]; if (!(E > 0) || !(t.S < E) || iv < 260) continue;
  const h = thTruong(t.ngay); if (!h) continue;
  const r = mo(t, { E, vao: iv + 1, banTu: iv + 3, S: t.S }); if (!r) continue;
  let hh = -Infinity, ll = Infinity; for (let k = iv - 119; k <= iv; k++) { hh = Math.max(hh, t.high[k]); ll = Math.min(ll, t.low[k]); }
  let h250 = -Infinity; for (let k = iv - 249; k <= iv; k++) h250 = Math.max(h250, t.high[k]);
  const c = t.close[iv], dt = t.dacTrung;
  let s200 = 0; for (let k = iv - 199; k <= iv; k++) s200 += t.close[k]; s200 /= 200;
  ds.push({ t, E, h, ret: r.ret, ngay: t.ngay, nam: t.ngay.slice(0, 4), kc: t.ngay >= "2022-05-01", loai: t.loai,
    f: { vt120: (c - ll) / (hh - ll), gan52: (c / h250 - 1) * 100, tren50: t.sma50[iv] > 0 ? (c / t.sma50[iv] - 1) * 100 : null, tren200: (c / s200 - 1) * 100, rs: dt["Suc manh so voi VN-Index (RS 20 phien)"], relVol: dt["Khoi luong tuong doi (RelVol)"],
      diem: dt["Tong diem luc vao (diem)"], adx: dt["ADX"], gtgd: dt["GTGD TB20 (ty/phien)"], catLo: -dt["Cat lo CHAT (cat lo % nho hon = tot hon)"], rr: dt["TP1 / cat lo (ty le thuong/rui ro)"], dongLuc: dt["Tang 20 phien truoc do (dong luc)"], kijun: dt["Gia so voi Kijun (% tren Kijun)"], gap: (E / c - 1) * 100 } });
}
const R = (g) => g.map((x) => x.ret);
const mota = (g) => `n=${String(g.length).padStart(4)} | TB ${f(tb(R(g))).padStart(6)}% | thang ${f((g.filter((x) => x.ret > 0).length / (g.length || 1)) * 100, 0).padStart(2)}% | KP ${f(tb(R(g.filter((x) => !x.kc)))).padStart(6)}% (n${String(g.filter((x) => !x.kc).length).padStart(3)}) | KC ${f(tb(R(g.filter((x) => x.kc)))).padStart(6)}% (n${String(g.filter((x) => x.kc).length).padStart(3)})`;
function ci(tap, A, B, so = 2000) { // chenh TB (A - B), khoang tin cay 95% lay mau lai theo cum thang
  const th = [...new Set(tap.map((x) => x.ngay.slice(0, 7)))]; const idx = new Map(th.map((m) => [m, [0, 0, 0, 0]]));
  for (const x of A) { const g = idx.get(x.ngay.slice(0, 7)); if (g) { g[0] += x.ret; g[1]++; } } for (const x of B) { const g = idx.get(x.ngay.slice(0, 7)); if (g) { g[2] += x.ret; g[3]++; } }
  let seed = 2468; const rd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const kq = []; for (let k = 0; k < so; k++) { let a = 0, na = 0, b = 0, nb = 0; for (let i = 0; i < th.length; i++) { const g = idx.get(th[Math.floor(rd() * th.length)]); a += g[0]; na += g[1]; b += g[2]; nb += g[3]; } if (na && nb) kq.push(a / na - b / nb); }
  kq.sort((x, y) => x - y); return A.length < 12 || B.length < 12 ? [NaN, NaN, NaN] : [tb(R(A)) - tb(R(B)), kq[Math.floor(kq.length * 0.025)], kq[Math.floor(kq.length * 0.975)]];
}
const ciS = (tap, A, B) => { const [d, lo, hi] = ci(tap, A, B); return Number.isFinite(d) ? `${f(d)}% [${f(lo)} .. ${f(hi)}]` : "-"; };

const BOI_CANH = {
  "Khong loc (tat ca)": () => true,
  "VN-Index duoi SMA50": (h) => h.duoi50,
  "VN-Index duoi SMA50 VA SMA200": (h) => h.duoi50 && h.duoi200,
  "Do rong SMA50 < 40%": (h) => h.dr50 != null && h.dr50 < 40,
  "Do rong SMA50 < 35%": (h) => h.dr50 != null && h.dr50 < 35,
  "Do rong Kijun < 40%": (h) => h.drK != null && h.drK < 40,
  "Duoi SMA50 VA do rong SMA50 < 40%": (h) => h.duoi50 && h.dr50 != null && h.dr50 < 40,
  "Duoi SMA20, SMA50, SMA200 (nhu hien nay)": (h) => h.duoi20 && h.duoi50 && h.duoi200,
  "Sut tu dinh 250 phien > 7%": (h) => h.sut < -7,
  "Sut tu dinh 250 phien > 10%": (h) => h.sut < -10,
  "VN-Index giam 20 phien > 3%": (h) => h.ret20 != null && h.ret20 < -3,
  "Diem VN-Index < -1,5": (h) => h.diem < -1.5,
};
console.log(`\nTong ${ds.length} lenh. Moc chung: ${mota(ds)}`);
console.log("\n=== 1. Dinh nghia THI TRUONG XAU: lenh co / khong thuoc boi canh do ===");
const TAP = {};
for (const [ten, fn] of Object.entries(BOI_CANH)) { const co = ds.filter((x) => fn(x.h)), kh = ds.filter((x) => !fn(x.h)); TAP[ten] = co; console.log(`   ${ten.padEnd(40)} CO ${mota(co)}`); if (ten !== "Khong loc (tat ca)") console.log(`   ${"".padEnd(40)} KHONG ${mota(kh)}  | chenh ${ciS(ds, co, kh)}`); }

const XAU = "Duoi SMA50 VA do rong SMA50 < 40%";
const xau = TAP[XAU];
console.log(`\n=== BOI CANH XAU DUOC CHON: "${XAU}" — ${mota(xau)} ===`);
console.log("   Theo nam: " + [...new Set(xau.map((x) => x.nam))].sort().map((y) => { const g = xau.filter((x) => x.nam === y); return `${y} ${f(tb(R(g)), 1)}% (n${g.length})`; }).join(" | "));

console.log("\n=== 2. Trong thi truong xau: loc lenh theo dac diem cua chinh ma (CO - KHONG, ca 2 giai doan phai cung tot hon) ===");
const nguong = {
  vt120: [0.5, 0.6, 0.7, 0.8], gan52: [-20, -10, -5], tren50: [0, 3, 6], tren200: [0, 5, 10], rs: [0, 3, 6], relVol: [1, 1.5, 2], diem: [1.5, 2, 2.5, 3], adx: [20, 25, 30], gtgd: [10, 30, 100],
  catLo: [4, 5, 6], rr: [1.5, 2, 2.5], dongLuc: [0, 5, 10], kijun: [0, 2, 4], gap: [0.5, 1, 2],
};
const NHAN = { vt120: "vi tri trong bien do 120 phien >=", gan52: "cach dinh 250 phien (%) >=", tren50: "tren SMA50 cua ma (%) >=", tren200: "tren SMA200 cua ma (%) >=", rs: "RS so voi VN-Index >=", relVol: "khoi luong tuong doi >=", diem: "diem he thong luc vao >=", adx: "ADX >=", gtgd: "GTGD TB20 (ty) >=", catLo: "khoang cach cat lo (%) <=", rr: "TP1 / cat lo >=", dongLuc: "tang 20 phien truoc >=", kijun: "tren Kijun (%) >=", gap: "gap mo cua phien sau (%) <=" };
const ungVien = [];
for (const [khoa, ds_] of Object.entries(nguong)) for (const ng of ds_) {
  const ngc = khoa === "catLo" || khoa === "gap";
  const hopLe = (x) => x.f[khoa] != null && Number.isFinite(x.f[khoa]);
  const fn = (x) => (ngc ? x.f[khoa] <= ng : x.f[khoa] >= ng);
  const tap = xau.filter(hopLe); const A = tap.filter(fn), B = tap.filter((x) => !fn(x));
  if (A.length < 40 || B.length < 40) continue;
  const kpA = A.filter((x) => !x.kc), kpB = B.filter((x) => !x.kc), kcA = A.filter((x) => x.kc), kcB = B.filter((x) => x.kc);
  const dkp = kpA.length >= 15 && kpB.length >= 15 ? tb(R(kpA)) - tb(R(kpB)) : NaN, dkc = kcA.length >= 15 && kcB.length >= 15 ? tb(R(kcA)) - tb(R(kcB)) : NaN;
  ungVien.push({ ten: `${NHAN[khoa]} ${ng}`, A, B, tap, dkp, dkc });
}
console.log(`   ${"Dieu kien".padEnd(46)} ${"GIU LAI (co)".padEnd(76)} | chenh (co - khong) [CI cum thang] | KP / KC`);
for (const u of ungVien.sort((a, b) => tb(R(b.A)) - tb(R(a.A)))) console.log(`   ${u.ten.padEnd(46)} ${mota(u.A)} | ${ciS(u.tap, u.A, u.B).padEnd(24)} | ${f(u.dkp, 1).padStart(5)} / ${f(u.dkc, 1).padStart(5)}${u.dkp > 0 && u.dkc > 0 ? "  <- ca 2 giai doan tot hon" : ""}`);

console.log("\n=== 3. Trong thi truong xau: doi cach thoat (cung tap lenh, chi doi luat thoat) ===");
function thoat(ten, tuyChon, tap = xau) {
  const r = []; for (const x of tap) { const o = typeof tuyChon === "function" ? tuyChon(x) : tuyChon; const k = mo(x.t, { E: x.E, vao: x.t.iv + 1, banTu: x.t.iv + 3, S: x.t.S, ...o }); if (k) r.push({ ...x, ret: k.ret, phien: k.phien }); }
  const A = r; const w = A.filter((x) => x.ret > 0), l = A.filter((x) => x.ret <= 0);
  console.log(`   ${ten.padEnd(46)} ${mota(A)} | giu TB ${f(tb(A.map((x) => x.phien)), 0).padStart(2)} phien | lai/lo ${f(tb(R(w)) / -tb(R(l)))} | chenh so voi goc ${f(tb(R(A)) - tb(R(tap)))}%`);
  return r;
}
thoat("GOC (luat he thong)", {});
thoat("Doi cat lo ve gia mua sau TP1", { beSauTP1: true });
thoat("Ban 50% o TP1, con lai doi cat lo ve gia mua", { moc: [{ w: 0.5, i: 0 }], beSauTP1: true });
thoat("Ban HET o TP1", { moc: [{ w: 1, i: 0 }] });
thoat("Chot het khi lai +5%", (x) => ({ tp: [x.E * 1.05, x.E * 1.1, x.E * 1.15], moc: [{ w: 1, i: 0 }] }));
thoat("Chot het khi lai +8%", (x) => ({ tp: [x.E * 1.08, x.E * 1.16, x.E * 1.24], moc: [{ w: 1, i: 0 }] }));
thoat("Thoat sau 5 phien neu chua ban", { thoiGian: 5 });
thoat("Thoat sau 10 phien neu chua ban", { thoiGian: 10 });
thoat("Thoat sau 15 phien neu chua ban", { thoiGian: 15 });
thoat("Cat lo HEP mot nua", (x) => ({ S: x.E - 0.5 * (x.E - x.t.S) }));
thoat("Cat lo HEP 70%", (x) => ({ S: x.E - 0.7 * (x.E - x.t.S) }));
thoat("Cat lo RONG gap ruoi", (x) => ({ S: x.E - 1.5 * (x.E - x.t.S) }));
thoat("Cat lo HEP mot nua + thoat sau 10 phien", (x) => ({ S: x.E - 0.5 * (x.E - x.t.S), thoiGian: 10 }));
thoat("Cat lo 3% co dinh", (x) => ({ S: x.E * 0.97 }));
thoat("Cat lo 4% co dinh", (x) => ({ S: x.E * 0.96 }));
thoat("Cat lo 5% co dinh", (x) => ({ S: x.E * 0.95 }));

console.log("\n=== 4. Bo (dung ngoai) cac lenh trong thi truong xau: ket qua toan he thong ===");
const khongXau = ds.filter((x) => !BOI_CANH[XAU](x.h));
console.log(`   Giu moi lenh      ${mota(ds)}`);
console.log(`   Bo lenh luc xau   ${mota(khongXau)}   | ${((xau.length / ds.length) * 100).toFixed(0)}% so lenh bi bo`);

console.log("\n=== 5. DO BEN cua 'vi tri trong bien do 120 phien >= 0,8' trong thi truong xau ===");
for (const [ten, fn] of Object.entries(BOI_CANH)) {
  if (ten === "Khong loc (tat ca)") continue;
  const tap = ds.filter((x) => fn(x.h)); for (const ng of [0.7, 0.8]) { const A = tap.filter((x) => x.f.vt120 >= ng), B = tap.filter((x) => x.f.vt120 < ng);
    console.log(`   ${ten.padEnd(40)} vi tri >= ${ng}: ${mota(A)} | con lai ${f(tb(R(B)))}% (n${B.length}) | chenh ${ciS(tap, A, B)}`); }
}
console.log("   Theo nam trong boi canh chon (vi tri >= 0,8 | con lai):");
for (const y of [...new Set(xau.map((x) => x.nam))].sort()) { const a = xau.filter((x) => x.nam === y && x.f.vt120 >= 0.8), b = xau.filter((x) => x.nam === y && x.f.vt120 < 0.8); if (a.length + b.length < 8) continue; console.log(`     ${y}: gan dinh ${a.length ? f(tb(R(a))).padStart(6) + "%" : "     -"} (n${String(a.length).padStart(3)}) | con lai ${f(tb(R(b))).padStart(6)}% (n${String(b.length).padStart(3)})`); }
{ const A = xau.filter((x) => x.f.vt120 >= 0.8), B = xau.filter((x) => x.f.vt120 < 0.8);
  console.log(`   Boi canh xau: gan dinh ${mota(A)} | con lai ${mota(B)}`);
  const sutGiam = (g) => { const s = [...g].sort((a, b) => (a.ngay < b.ngay ? -1 : 1)); let c = 0, pk = 0, dd = 0; for (const x of s) { c += x.ret; pk = Math.max(pk, c); dd = Math.max(dd, pk - c); } return dd; };
  console.log(`   Cong don (don vi % moi lenh) trong thi truong xau: tat ca ${f(R(xau).reduce((a, b) => a + b, 0), 0)}% (sut toi da ${f(sutGiam(xau), 0)}%) | chi gan dinh ${f(R(A).reduce((a, b) => a + b, 0), 0)}% (sut ${f(sutGiam(A), 0)}%) | bo qua nhom con lai ${f(R(B).reduce((a, b) => a + b, 0), 0)}%`); }

console.log("\n=== 6. HOM NAY: cac ma dang bao MUA, vi tri trong bien do 120 phien ===");
{ const cache = JSON.parse((await import("node:fs")).readFileSync(new URL("../output/nen_dai.json", import.meta.url), "utf-8"));
  const res = await fetch("https://www.cloudstock.id.vn/api/signals", { headers: { "x-api-key": process.env.CS_UPLOAD_API_KEY || "CLOUD" } }); const j = await res.json();
  const mua = (j.tinHieu || []).filter((r) => r.tin === "MUA");
  for (const r of mua) { const nen = cache[r.ma]; if (!nen) { console.log(`   ${r.ma}: khong co nen`); continue; } const n = nen.length, c = nen[n - 1].c; let hh = -Infinity, ll = Infinity; for (let k = n - 120; k < n; k++) { hh = Math.max(hh, nen[k].h); ll = Math.min(ll, nen[k].l); } console.log(`   ${r.ma}: nen cuoi ${nen[n - 1].t}, gia ${c}, vi tri ${f((c - ll) / (hh - ll))} (${(c - ll) / (hh - ll) >= 0.8 ? "GAN DINH" : "khong gan dinh"}), diem ${r.diem}`); } }
process.exit(0);
