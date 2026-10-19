// BACKTEST "VOL NHIP CHINH LON THI KHONG CO LENH MUA MOI" (Hieu hoi 2026-10-19): truoc khi vao lenh (nhat la lenh MUA MOI = gia hoi ve Kijun roi bat len, danh cho nguoi dang giu / lo lenh dau),
// nhin NHIP CHINH vua qua: tu dinh gan nhat (cao nhat 30 nen truoc, 20 nen voi lenh Mua thuong) toi truoc phien tin hieu, relVol TB (KL / TB20) cua cac phien do. Neu >= k (chinh vol lon = mat xu huong)
// thi BO lenh. So sanh nhom bi giu lai (vol chinh be) voi nhom bi loai (vol chinh lon): lai TB, ty le thang, PF, theo giai doan. Cach vao / chot: mua ATC gia dong cua phien tin hieu + T+2,
// 30% TP1 + 30% TP2 + 40% giu den tin hieu BAN / cat lo / hoa von sau TP2 (lenh mua moi: dong cung lenh dau). Chi phi 0,4%/lenh. Chi DOC cache (nen_dai.json + vnindex_dai.json).
// CACH CHAY: node engine/dich-vu/backtestVolChinhTruocMua.mjs
import { docJson, chayEngine, moPhongThucTe, thongKe, tb, f, kyOf, TEN_KY } from "./backtestChung.mjs";

const cache = docJson("nen_dai.json");
const vni = docJson("vnindex_dai.json");
const { lenh: tatCa, lenhMuaMoi, soMa } = chayEngine({ cache, vni });
const muaThuong = tatCa.filter((t) => t.loai === 1);
const atc = (t, o = {}) => moPhongThucTe(t, { ...o, E: t.close[t.iv], vao: t.iv, banTu: t.iv + 2 });
const mm = (t) => atc(t, { dongTai: t.jGoc, theoTinHieuBan: false });

// vol TB nhip chinh truoc phien tin hieu; tra ve { vol, sau (so phien tu dinh), sauDinhPct } hoac null
function nhipChinh(t, soNen) {
  const { iv, high, relVol, close } = t;
  if (iv < soNen + 2) return null;
  let dIdx = iv - 1;
  for (let j = iv - 1; j >= iv - soNen; j--) if (high[j] > high[dIdx]) dIdx = j;
  if (dIdx >= iv - 1) return { vol: relVol[iv - 1], soPhien: 1, depth: (1 - close[iv - 1] / high[dIdx]) * 100 }; // dinh la phien ngay truoc: chinh 1 phien
  let tong = 0, dem = 0;
  for (let j = dIdx + 1; j <= iv - 1; j++) { tong += relVol[j]; dem++; }
  return { vol: tong / dem, soPhien: dem, depth: (1 - close[iv - 1] / high[dIdx]) * 100 };
}

const DAU = `${"".padEnd(48)} ${"n".padStart(5)} ${"laiTB".padStart(6)} ${"trungVi".padStart(7)} ${"thang%".padStart(6)} ${"PF".padStart(5)} | ${TEN_KY.map((k) => (k + " lai TB (n)").padStart(18)).join(" ")}`;
function dong(ten, ds, fn) {
  const kq = ds.map((t) => ({ t, r: fn(t) })).filter((x) => x.r != null && Number.isFinite(x.r));
  const k = thongKe(kq.map((x) => ({ ret: x.r, phien: 1 })));
  const ky = [0, 1, 2].map((j) => {
    const a = kq.filter((x) => kyOf(x.t.ngay) === j).map((x) => x.r);
    return a.length ? `${f(tb(a))} (${a.length})` : "-";
  });
  console.log(`${ten.padEnd(48)} ${String(k.n).padStart(5)} ${f(k.tb).padStart(6)} ${f(k.trungVi).padStart(7)} ${f(k.thang, 1).padStart(6)} ${f(k.pf).padStart(5)} | ${ky.map((v) => v.padStart(18)).join(" ")}`);
  return k;
}

const KS = [0.8, 1.0, 1.2, 1.5];
for (const [tenLoai, ds, fn, soNen] of [
  ["LENH MUA MOI (gia hoi ve Kijun roi bat len)", lenhMuaMoi, mm, 30],
  ["LENH MUA THUONG (doi chieu)", muaThuong, atc, 20],
]) {
  const co = ds.map((t) => ({ t, nc: nhipChinh(t, soNen) })).filter((x) => x.nc);
  console.log(`\n=========== ${tenLoai}: ${ds.length} lenh (${soMa} ma), co nhip chinh do duoc: ${co.length} ===========\n${DAU}`);
  dong("Tat ca (khong loc)", co.map((x) => x.t), fn);
  console.log(`  (nhip chinh TB: ${f(tb(co.map((x) => x.nc.soPhien)), 1)} phien, sau dinh ${f(tb(co.map((x) => x.nc.depth)), 1)}%)`);
  for (const k of KS) {
    const giu = co.filter((x) => x.nc.vol < k).map((x) => x.t);
    const loai = co.filter((x) => x.nc.vol >= k).map((x) => x.t);
    dong(`Vol chinh < ${k.toFixed(1)}: GIU lenh`, giu, fn);
    dong(`Vol chinh >= ${k.toFixed(1)}: BO lenh (nhom bi loai)`, loai, fn);
  }
  // theo nhom vol (khong chong lan)
  console.log("  -- theo nhom vol nhip chinh --");
  for (const [ten, a, b] of [["< 0.7", 0, 0.7], ["0.7-1.0", 0.7, 1.0], ["1.0-1.3", 1.0, 1.3], ["1.3-1.8", 1.3, 1.8], [">= 1.8", 1.8, 1e9]])
    dong(`  nhom vol chinh ${ten}`, co.filter((x) => x.nc.vol >= a && x.nc.vol < b).map((x) => x.t), fn);
}
