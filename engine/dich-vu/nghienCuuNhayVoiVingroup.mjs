// NGANH / CO PHIEU NHAY NHAT KHI NHOM VINGROUP CHINH (Hieu 2026-10-23: "kiem tra khi nhom vingroup chinh, nhom nganh va co phieu nao nhay nhat").
// Nhom Vingroup = trung binh lai ngay cua VIC, VHM, VRE. SU KIEN = ngay nhom giam >= 2% (va >= 3%). Giai doan tu 2022-05 (cung ky voi cac nghien cuu he thong).
// Voi moi ma / nganh (nganh = trung binh lai ngay cac ma thanh vien, bo ma Vin):
//  - LAI SU KIEN va LAI NGAY THUONG, chenh lech (phan ung tho);
//  - PHAN UNG VUOT THI TRUONG = lai su kien - (alpha + beta x lai THI TRUONG KHONG GOM VIN), thi truong = trung binh lai ngay moi ma da loc (bo VIC/VHM/VRE/VPL), alpha / beta uoc luong tren ngay THUONG - do ma / nganh bi dap manh hon (am) hay chiu tot hon (duong) so voi muc beta giai thich, kem thong ke t.
//    (Lan chay dau dung VN-Index lam thi truong cho ket qua SAI: VN-Index co Vin nen giam manh vi chinh Vin, ma beta cao tu dong cho 'phan ung vuot' duong gia tao.)
//  - TUONG QUAN lai ngay voi nhom Vin tren toan bo ngay.
// Ma: GTGD TB >= 5 ty, >= 400 phien trong giai doan. CHI DOC cache. CACH CHAY: node engine/dich-vu/nghienCuuNhayVoiVingroup.mjs
import { docJson } from "./backtestChung.mjs";
import { NGANH } from "../danh-sach/nganh.js";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const TU = "2022-05-01";
const VIN = ["VIC", "VHM", "VRE"];
const tb = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const sd = (a) => { const m = tb(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "-");
const rets = (nen) => { const m = new Map(); for (let i = 1; i < nen.length; i++) if (nen[i].t >= TU && nen[i - 1].c > 0) m.set(nen[i].t, (nen[i].c / nen[i - 1].c - 1) * 100); return m; };

const vr = new Map(); for (let i = 1; i < vni.length; i++) if (vni[i].t >= TU) vr.set(vni[i].t, (vni[i].c / vni[i - 1].c - 1) * 100);
const vinR = VIN.map((m) => rets(cache[m]));
const nhomVin = new Map();
for (const d of vr.keys()) if (vinR.every((m) => m.has(d))) nhomVin.set(d, tb(vinR.map((m) => m.get(d))));
const ngay = [...nhomVin.keys()];
const ttKhongVin = new Map(); // ngay -> TB lai cac ma da loc (khong gom Vin), tinh sau khi co RM

const RM = new Map();
for (const [ma, nen] of Object.entries(cache)) {
  if (VIN.includes(ma) || ma === "VPL" || nen.length < 400) continue;
  const gan = nen.filter((b) => b.t >= TU);
  if (gan.length < 400) continue;
  if (tb(gan.map((b) => (b.c * b.v) / 1e6)) < 5) continue;
  RM.set(ma, rets(nen));
}
for (const d of ngay) { const v = [...RM.values()].filter((m) => m.has(d)).map((m) => m.get(d)); if (v.length >= 100) ttKhongVin.set(d, tb(v)); }
console.log(`${ngay.length} phien tu ${TU}; ${RM.size} ma (GTGD TB >= 5 ty); nhom Vin = TB(${VIN.join(", ")})\n`);

function phanTich(m, nguong) {
  const ev = ngay.filter((d) => nhomVin.get(d) <= -nguong && m.has(d)), th = ngay.filter((d) => nhomVin.get(d) > -nguong && m.has(d));
  if (ev.length < 20 || th.length < 100) return null;
  const x = th.filter((d) => ttKhongVin.has(d)).map((d) => ttKhongVin.get(d)); th.splice(0, th.length, ...th.filter((d) => ttKhongVin.has(d))); const y = th.map((d) => m.get(d));
  const mx = tb(x), my = tb(y);
  const beta = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0) / x.reduce((s, v) => s + (v - mx) ** 2, 0), alpha = my - beta * mx;
  const res = ev.filter((d) => ttKhongVin.has(d)).map((d) => m.get(d) - (alpha + beta * ttKhongVin.get(d)));
  const raw = tb(ev.map((d) => m.get(d)));
  const cx = ngay.filter((d) => m.has(d)).map((d) => nhomVin.get(d)), cy = ngay.filter((d) => m.has(d)).map((d) => m.get(d));
  const mcx = tb(cx), mcy = tb(cy);
  const tuongQuan = cx.reduce((s, v, i) => s + (v - mcx) * (cy[i] - mcy), 0) / (cx.length - 1) / (sd(cx) * sd(cy));
  return { n: ev.length, raw, thuong: tb(th.map((d) => m.get(d))), chenh: raw - tb(th.map((d) => m.get(d))), beta, vuot: tb(res), t: tb(res) / (sd(res) / Math.sqrt(res.length)), tuongQuan };
}
const nganhRet = new Map();
for (const [ten, ds] of NGANH) {
  const mem = [...ds].filter((ma) => RM.has(ma));
  if (mem.length < 3) continue;
  const m = new Map();
  for (const d of ngay) { const v = mem.filter((ma) => RM.get(ma).has(d)).map((ma) => RM.get(ma).get(d)); if (v.length >= Math.max(2, mem.length * 0.6)) m.set(d, tb(v)); }
  nganhRet.set(ten, { m, soMa: mem.length });
}
for (const nguong of [2, 3]) {
  const nd = ngay.filter((d) => nhomVin.get(d) <= -nguong).length;
  console.log(`######## NHOM VIN GIAM >= ${nguong}%: ${nd} phien (VN-Index TB ${f(tb(ngay.filter((d) => nhomVin.get(d) <= -nguong).map((d) => vr.get(d))))}%, thi truong khong gom Vin TB ${f(tb(ngay.filter((d) => nhomVin.get(d) <= -nguong && ttKhongVin.has(d)).map((d) => ttKhongVin.get(d))))}%) ########`);
  console.log(`\n--- NGANH (xep theo phan ung vuot thi truong, am nhat truoc = nhay nhat) ---`);
  console.log(`   ${"nganh".padEnd(24)} | so ma | lai su kien | thuong | vuot TT (t)      | beta | tuong quan voi Vin`);
  const dn = [...nganhRet.entries()].map(([ten, o]) => ({ ten, soMa: o.soMa, ...phanTich(o.m, nguong) })).filter((x) => x.n).sort((a, b) => a.vuot - b.vuot);
  for (const x of dn) console.log(`   ${x.ten.padEnd(24)} | ${String(x.soMa).padStart(5)} | ${f(x.raw).padStart(10)} | ${f(x.thuong).padStart(6)} | ${f(x.vuot).padStart(5)} (${f(x.t, 1).padStart(5)}) | ${f(x.beta).padStart(4)} | ${f(x.tuongQuan).padStart(6)}`);
  const dm = [...RM.entries()].map(([ma, m]) => ({ ma, nganh: [...NGANH].find(([, s]) => s.has(ma))?.[0] ?? "-", ...phanTich(m, nguong) })).filter((x) => x.n).sort((a, b) => a.vuot - b.vuot);
  const hien = (a) => { for (const x of a) console.log(`   ${x.ma.padEnd(6)} ${x.nganh.padEnd(22)} | lai su kien ${f(x.raw).padStart(6)} | vuot TT ${f(x.vuot).padStart(5)} (t ${f(x.t, 1).padStart(5)}) | beta ${f(x.beta)} | tuong quan ${f(x.tuongQuan)}`); };
  console.log(`\n--- 15 CO PHIEU NHAY NHAT (bi dap manh hon thi truong giai thich) / ${dm.length} ma ---`);
  hien(dm.slice(0, 15));
  console.log(`\n--- 10 CO PHIEU CHIU TOT NHAT ---`);
  hien(dm.slice(-10).reverse());
  const tqCao = [...dm].sort((a, b) => b.tuongQuan - a.tuongQuan).slice(0, 10);
  console.log(`\n--- 10 CO PHIEU DI CUNG NHOM VIN NHAT (tuong quan lai ngay) ---`);
  hien(tqCao);
  console.log();
}
