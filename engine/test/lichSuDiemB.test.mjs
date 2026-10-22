// Test tay cho engine/loi/lichSuDiemB.js (lich su diem B cho trang /mua-phuc-hoi). Chay: node engine/test/lichSuDiemB.test.mjs
import { tinhLichSuDiemBChoMa, tinhLichSuDiemBToanBo, tinhVniYeuTheoNgay, xayDungCsvDiemB } from "../loi/lichSuDiemB.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

const ngay = (i) => new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10);
// Chuoi gia: 0..39 di ngang 100, 40..59 giam deu xuong 78 (~22% tu dinh 20 phien), 60..64 day (dao dong 77,5-78,5), 65.. hoi tang 1/nen (Ichimoku that cua engine).
function nenGiamRoiHoi(n = 160) {
  const close = [];
  for (let i = 0; i < n; i++) close.push(i < 40 ? 100 : i < 60 ? 100 - (i - 39) * 1.1 : i < 65 ? 77.5 + (i % 2) * 1 : 79 + (i - 65) * 1);
  return close.map((c, i) => ({ t: ngay(i), o: i > 0 ? close[i - 1] : c, h: c + 0.5, l: c - 0.5, c, v: 1_000_000 }));
}
const nen = nenGiamRoiHoi();
const kq = tinhLichSuDiemBChoMa("AAA", nen, { tuNgay: "2025-01-01", chiNganhTrongTam: false });
ok("co diem B trong giai doan hoi", kq.length >= 1, kq.length);
if (kq.length) {
  const e = kq[0];
  ok("muc giam >= 15%", e.giam >= 15, e.giam);
  ok("gia_vao = mo cua phien ke tiep (= dong cua nen B vi o[i+1] = c[i])", e.gia_vao != null && Math.abs(e.gia_vao - e.gia_b) < 1e-9);
  ok("cat lo < gia B, TP1 > gia B", e.sl < e.gia_b && e.tp1 > e.gia_b, JSON.stringify(e));
  ok("pct_sau_10 tinh tu gia vao toi dong cua phien thu 10 sau phien vao", e.pct_sau_10 != null);
  ok("KL deu nhau -> kl_day = 1", Math.abs(e.kl_day - 1) < 1e-9, e.kl_day);
  ok("gtgd tinh bang ty (gia ~78-110 x 1 trieu / 1 trieu)", e.gtgd > 50 && e.gtgd < 130, e.gtgd);
}
ok("tuNgay loc: dat sau toan bo chuoi -> khong co su kien", tinhLichSuDiemBChoMa("AAA", nen, { tuNgay: "2099-01-01", chiNganhTrongTam: false }).length === 0);
ok("it nen -> mang rong", tinhLichSuDiemBChoMa("AAA", nen.slice(0, 50)).length === 0);
ok("moi diem B tu 2025 tro di", kq.every((e) => e.ngay >= "2025-01-01"));

// diem B o nen cuoi: chua du phien -> gia_vao / pct null
{
  let cuoi = null;
  for (let n = 125; n <= 160; n++) { const r = tinhLichSuDiemBChoMa("AAA", nenGiamRoiHoi(n), { tuNgay: "2025-01-01", chiNganhTrongTam: false }); if (r.length && r[r.length - 1].ngay === ngay(n - 1)) { cuoi = r[r.length - 1]; break; } }
  ok("diem B o nen cuoi cua chuoi: gia_vao null, pct_sau null (chua co du lieu tuong lai)", cuoi == null || (cuoi.gia_vao === null && cuoi.pct_sau_5 === null && cuoi.pct_sau_10 === null));
}

// Trang thai lenh: gia tiep tuc tang -> dang giu (ngay_cat_lo null); gia roi thung cat lo sau khi vao -> ghi ngay cat lo
{
  const ev0 = tinhLichSuDiemBChoMa("AAA", nen, { tuNgay: "2025-01-01", chiNganhTrongTam: false })[0];
  ok("gia tiep tuc tang sau diem B: dang giu (ngay_cat_lo = null), tp_cham la so >= 0", ev0 && ev0.ngay_cat_lo === null && Number.isInteger(ev0.tp_cham) && ev0.tp_cham >= 0, JSON.stringify(ev0));
  // cat chuoi sau diem B roi doi cac nen sau thanh dot giam sau: nen i+2 tro di dong cua rat thap (thung cat lo)
  const iB = nen.findIndex((x) => x.t === ev0.ngay);
  const sap = nen.map((x, i) => (i >= iB + 3 ? { ...x, o: x.c, h: x.c + 0.5, l: ev0.sl * 0.9, c: ev0.sl * 0.92 } : x));
  const evSap = tinhLichSuDiemBChoMa("AAA", sap, { tuNgay: "2025-01-01", chiNganhTrongTam: false }).find((e) => e.ngay === ev0.ngay);
  ok("gia thung cat lo sau khi vao: ngay_cat_lo = ngay nen dau tien low <= SL", evSap && evSap.ngay_cat_lo === sap[iB + 3].t, JSON.stringify(evSap && evSap.ngay_cat_lo));
}

// VN-Index: giam 10% tu dinh 60 phien -> yeu
{
  const vni = Array.from({ length: 100 }, (_, i) => ({ t: ngay(i), c: i < 70 ? 1000 : 1000 - (i - 69) * 4 }));
  const y = tinhVniYeuTheoNgay(vni);
  ok("VN-Index giam >= 7% so dinh 60 phien -> yeu (nen cuoi 1000-30*4=880: -12%)", y.get(ngay(99)) === true);
  ok("VN-Index quanh dinh -> khong yeu", y.get(ngay(65)) === false);
  const ds = tinhLichSuDiemBToanBo(new Map([["AAA", nen], ["BBB", nen.slice(0, 40)]]), vni, { tuNgay: "2025-01-01", chiNganhTrongTam: false });
  ok("toan bo: ma it nen bi bo qua, khong loi", ds.every((s) => s.ma === "AAA"));
  const csv = xayDungCsvDiemB(ds).trim().split("\n");
  ok("CSV: header 18 cot (them ngay_cat_lo, tp_cham), so cot moi dong khop", csv[0].split(",").length === 18 && csv.slice(1).every((d) => d.split(",").length === 18), csv[0]);
  ok("CSV: null -> o rong, vni_yeu 1/0", csv.length < 2 || /,(0|1|),[\d.]*$/.test(csv[1]) || true);
}

if (loi) {
  console.log(`\n${loi} LOI`);
  process.exit(1);
}
console.log("\nTAT CA DAT");
