// NGHIEN CUU (2026-10-14): nguong RSI 70 / 30 cung co lam tin hieu "nhieu" khong, va vung dem (69-71, hysteresis) / doi nguong (68/32, 72/28) co tot hon khong?
// Moi bien the chay LAI TOAN BO engine (390 ma, 2013-2026) voi diem dong luc doi theo cau hinh, roi mo phong lenh MUA goc: mua MO CUA phien sau, thoat theo luat he thong, phi 0,4% / vong.
// Do: so lenh, lai TB, ty le thang, Profit Factor, sut giam lon nhat (cong don % theo ngay vao), truoc / tu 05/2022 (ngoai mau), va DO ON DINH so voi goc:
//   cung ngay = lenh goc cung ma vao dung ngay, lech <= 3 phien = cung ma vao lech vai ngay, mat / moi = khong co cap.
// Chay: node engine/dich-vu/nghienCuuVungDemRSI.mjs
import { docJson, chayEngine } from "./backtestChung.mjs";
import { mo, tb, f } from "./nghienCuuLenh.mjs";

const cache = docJson("nen_dai.json"), vni = docJson("vnindex_dai.json");
const BIEN_THE = [
  ["GOC 70 / 30 (cung)", {}],
  ["Nguong 68 / 32", { rsiTren: 68, rsiDuoi: 32 }],
  ["Nguong 72 / 28", { rsiTren: 72, rsiDuoi: 28 }],
  ["Nguong tren 68 (duoi 30)", { rsiTren: 68 }],
  ["Nguong tren 72 (duoi 30)", { rsiTren: 72 }],
  ["Vung dem 69-71, trung tinh (diem 0)", { rsiVungDem: 1, rsiKieuDem: "trungTinh" }],
  ["Vung dem 69-71, hysteresis (giu trang thai)", { rsiVungDem: 1, rsiKieuDem: "tre" }],
  ["Vung dem 68-72, trung tinh", { rsiVungDem: 2, rsiKieuDem: "trungTinh" }],
  ["Vung dem 68-72, hysteresis", { rsiVungDem: 2, rsiKieuDem: "tre" }],
  ["Vung dem 67-73, hysteresis", { rsiVungDem: 3, rsiKieuDem: "tre" }],
  ["Vung dem 66-74, trung tinh (diem 0)", { rsiVungDem: 4, rsiKieuDem: "trungTinh" }],
  ["Vung dem 65-75, trung tinh (diem 0)", { rsiVungDem: 5, rsiKieuDem: "trungTinh" }],
  ["Vung dem 60-80, trung tinh (diem 0)", { rsiVungDem: 10, rsiKieuDem: "trungTinh" }],
  ["RSI > 70 chi cho 0 diem (khong tru 0,5)", { rsiKieuDem: "quaMua0" }],
  ["Bo han diem dong luc RSI (luon +0,5 neu > 50)", { rsiTren: 101, rsiDuoi: 0 }],
];

function chay(thamSoThem) {
  const kq = chayEngine({ cache, vni, thamSoThem });
  const ds = [];
  for (const t of kq.lenh) {
    if (![1, 2, 3].includes(t.loai) || t.iv + 3 >= t.n) continue;
    const E = t.open[t.iv + 1]; if (!(E > 0) || !(t.S < E)) continue;
    const r = mo(t, { E, vao: t.iv + 1, banTu: t.iv + 3, S: t.S }); if (!r) continue;
    ds.push({ ma: t.ma, iv: t.iv, ngay: t.ngay, ret: r.ret, kc: t.ngay >= "2022-05-01" });
  }
  return ds;
}
function so(ds) {
  const R = ds.map((x) => x.ret), w = R.filter((v) => v > 0), l = R.filter((v) => v <= 0);
  const pf = -w.reduce((a, b) => a + b, 0) / l.reduce((a, b) => a + b, 0);
  const theoNgay = new Map(); for (const x of ds) theoNgay.set(x.ngay, (theoNgay.get(x.ngay) || 0) + x.ret);
  let c = 0, pk = 0, dd = 0; for (const [, v] of [...theoNgay.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) { c += v; pk = Math.max(pk, c); dd = Math.max(dd, pk - c); }
  const kp = ds.filter((x) => !x.kc), kc = ds.filter((x) => x.kc);
  return { n: ds.length, tb: tb(R), thang: (w.length / R.length) * 100, pf, dd, tong: R.reduce((a, b) => a + b, 0), tbKP: tb(kp.map((x) => x.ret)), tbKC: tb(kc.map((x) => x.ret)), nKC: kc.length, pfKC: (() => { const a = kc.map((x) => x.ret); const ww = a.filter((v) => v > 0).reduce((p, q) => p + q, 0), ll = -a.filter((v) => v <= 0).reduce((p, q) => p + q, 0); return ww / ll; })() };
}
function onDinh(goc, bt) { // so voi lenh goc: cung ngay / lech <= 3 phien / mat
  const theoMa = new Map(); for (const x of bt) { if (!theoMa.has(x.ma)) theoMa.set(x.ma, []); theoMa.get(x.ma).push(x.iv); }
  let cung = 0, lech = 0, mat = 0;
  for (const x of goc) { const a = theoMa.get(x.ma) || []; if (a.includes(x.iv)) cung++; else if (a.some((v) => Math.abs(v - x.iv) <= 3)) lech++; else mat++; }
  return { cung: (cung / goc.length) * 100, lech: (lech / goc.length) * 100, mat: (mat / goc.length) * 100 };
}

let goc = null;
console.log(`${"Bien the".padEnd(46)} | ${"n".padStart(5)} | ${"TB%".padStart(5)} | thang | ${"PF".padStart(4)} | sut(cong don %) | truoc 05/2022 | tu 05/2022 (n, TB, PF) | on dinh so voi goc: cung ngay / lech<=3 / mat`);
for (const [ten, tsm] of BIEN_THE) {
  const ds = chay(tsm); if (!goc) goc = ds;
  const s = so(ds), o = ds === goc ? null : onDinh(goc, ds);
  console.log(`${ten.padEnd(46)} | ${String(s.n).padStart(5)} | ${f(s.tb).padStart(5)} | ${f(s.thang, 0).padStart(4)}% | ${f(s.pf).padStart(4)} | ${f(s.dd, 0).padStart(7)}        | ${f(s.tbKP).padStart(6)}%      | ${String(s.nKC).padStart(4)}, ${f(s.tbKC).padStart(5)}%, ${f(s.pfKC)} | ${o ? `${f(o.cung, 0)}% / ${f(o.lech, 0)}% / ${f(o.mat, 0)}%` : "-"}`);
}
process.exit(0);
