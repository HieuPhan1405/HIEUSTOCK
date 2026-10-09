// Test tay cho lib/lenhMuaChot.js (lenh mua da chot trong khung gio, web tu giu khi tin hieu mat). Chay: node engine/test/lenhMuaChot.test.mjs
import { ungVienChotMua, danhGiaLenhMuaChot, heThongDangGiu, themMucCatLo, xacNhanUngVien, soPhienGiaoDich, SO_PHUT_XAC_NHAN_MUA } from "../../lib/lenhMuaChot.js";
import { lenhDangMo } from "../../lib/muaThemTinhToan.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b) => Math.abs(a - b) < 1e-6;
const NGAY = "2026-09-28";

// Ung vien: lenh dau vua MUA + lenh mua moi vua mo; khong lay ma dang NAM GIU tu truoc.
const tatCa = [
  { ma: "GMD", tin: "MUA", gia: 78.2, gia_mua: 78.2, ngay_mua: NGAY, stop_loss: 73.5, tp1: 82.11, tp2: 86.02, tp3: 89.93, gia_kich_hoat: 77.4 },
  { ma: "VPB", tin: "NAM GIU", gia: 23, gia_mua: 21, ngay_mua: "2026-08-26", stop_loss: 20, tp1: 22, tp2: 23.3, tp3: 25 },
  { ma: "FPT", tin: "NAM GIU", gia: 121, gia_mua: 110, ngay_mua: "2026-08-01", mua_giua: true, dang_giu_giua: true, gia_mua_giua: 120.5, ngay_mua_giua: NGAY, stop_giua: 115, tp1_giua: 126, tp2_giua: 132 },
];
const uv = ungVienChotMua(tatCa);
ok("ung vien: moi lenh he thong dang giu (GMD vua MUA, VPB + FPT NAM GIU, FPT mua moi)", uv.map((x) => `${x.ma}:${x.loai}`).join() === "GMD:goc,VPB:goc,FPT:goc,FPT:giua", JSON.stringify(uv));
ok("gia / cat lo / TP dong bang", uv[0].gia_mua === 78.2 && uv[0].stop_loss === 73.5 && uv[0].tp1 === 82.11 && uv[0].ngay_mua === NGAY);

// Loi GVR 07/10/2026: ma da co lenh WEB GIU (row.lenh_web la MANG) van phai chot duoc lenh moi cua he thong (Mua moi hom nay), khong coi dong sao chep tu row la "lenh web".
{
  const rowGVR = {
    ma: "GVR", tin: "NAM GIU", gia: 33.6, gia_mua: 32.2, ngay_mua: "2026-09-17", stop_loss: 30.27, tp1: 34.95, tp2: 35.4, tp3: 46.5,
    mua_giua: true, dang_giu_giua: true, gia_mua_giua: 33.55, ngay_mua_giua: "2026-10-07", stop_giua: 31.41, tp1_giua: 35.23, tp2_giua: 36.9, tp3_giua: 46.5,
    lenh_web: [{ ma: "GVR", loai: "giua", ngay_mua: "2026-10-02", gia_mua: 32.9, stop_loss: 31.19, tp1: 34.9, tp2: 36.19, tp3: 46.5, tp_da_cham: null }],
  };
  const u = ungVienChotMua([rowGVR]).map((x) => `${x.loai}:${x.ngay_mua}`).join();
  ok("ma co lenh web giu van chot duoc lenh Mua moi hom nay (giua 07/10) va lenh goc; khong lap lai lenh web (giua 02/10)", u === "goc:2026-09-17,giua:2026-10-07", u);
}

const lGMD = { ma: "GMD", loai: "goc", ngay_mua: NGAY, gia_mua: 78.2, stop_loss: 73.5, tp1: 82.11, tp2: 86.02, tp3: 89.93, so_phien_diem_thap: 0, ngay_diem: null, diem_cuoi: null, tp_da_cham: null };

// He thong con giu dung lenh -> khong tu quan ly
ok("he thong con MUA cung ngay -> he thong giu", heThongDangGiu(lGMD, { tin: "MUA", ngay_mua: NGAY }));
{
  const kq = danhGiaLenhMuaChot({ l: lGMD, row: { ma: "GMD", tin: "MUA", ngay_mua: NGAY, gia: 78.2, diem: 4.49 }, ngay: NGAY });
  ok("he thong giu: web_giu false, khong ghi gi", kq.capNhat.web_giu === false && kq.dongMoi.length === 0);
}
// Tin hieu mat (TRUNG LAP, ngay_mua cu): web giu, chua cham gi
{
  const kq = danhGiaLenhMuaChot({ l: lGMD, row: { ma: "GMD", tin: "TRUNG LAP", ngay_mua: "2026-08-10", gia: 77.8, diem: 2.99 }, ngay: NGAY });
  ok("tin hieu mat: web giu, chua dong", kq.capNhat.web_giu === true && !kq.capNhat.trang_thai && kq.dongMoi.length === 0);
}
// Cham TP1 + TP2 cung luc -> 2 dong chot 30%, cat lo doi ve gia mua
{
  const kq = danhGiaLenhMuaChot({ l: lGMD, row: { ma: "GMD", tin: "TRUNG LAP", gia: 87, diem: 3 }, ngay: NGAY });
  ok("cham TP2: ghi TP1 (vong 5) + TP2 (vong 6)", kq.dongMoi.map((d) => `${d.ly_do}:${d.vong}:${d.phan_chot_pct}`).join() === "TP1:5:30,TP2:6:30", JSON.stringify(kq.dongMoi));
  ok("TP ghi dung gia TP", kq.dongMoi[0].gia_ban === 82.11 && gan(kq.dongMoi[1].lai_lo_pct, (86.02 / 78.2 - 1) * 100));
  ok("tp_da_cham = TP2", kq.capNhat.tp_da_cham === "TP2");
}
// Sau TP2 gia ve gia mua -> hoa von 40% con lai
{
  const kq = danhGiaLenhMuaChot({ l: { ...lGMD, tp_da_cham: "TP2" }, row: { ma: "GMD", tin: "TRUNG LAP", gia: 78.1, diem: 1 }, daGhi: new Set([5, 6]), ngay: NGAY });
  ok("sau TP2 cham gia mua: BAO_VE_LAI, 40%", kq.dongMoi.length === 1 && kq.dongMoi[0].ly_do === "BAO_VE_LAI" && kq.dongMoi[0].phan_chot_pct === 40 && kq.capNhat.trang_thai === "dong");
}
// Cat lo
{
  const kq = danhGiaLenhMuaChot({ l: lGMD, row: { ma: "GMD", tin: "TRUNG LAP", gia: 73.4, diem: -0.5 }, ngay: NGAY });
  ok("cham cat lo: CAT_LO 100%, vong 1", kq.dongMoi[0].ly_do === "CAT_LO" && kq.dongMoi[0].phan_chot_pct === 100 && kq.dongMoi[0].vong === 1 && kq.dongMoi[0].gia_ban === 73.4);
}
// Diem thap 3 phien lien -> BAN
{
  const l = { ...lGMD, so_phien_diem_thap: 1, ngay_diem: "2026-09-30", diem_cuoi: -2 };
  const cungPhien = danhGiaLenhMuaChot({ l, row: { ma: "GMD", tin: "TRUNG LAP", gia: 76, diem: -2 }, ngay: "2026-09-30" });
  ok("phien thu 2 diem thap: chua ban", cungPhien.dongMoi.length === 0 && cungPhien.capNhat.so_phien_diem_thap === 1);
  const phien3 = danhGiaLenhMuaChot({ l, row: { ma: "GMD", tin: "TRUNG LAP", gia: 76, diem: -1.8 }, ngay: "2026-10-01" });
  ok("phien thu 3 diem <= -1,5: BAN", phien3.dongMoi.length === 1 && phien3.dongMoi[0].ly_do === "BAN" && phien3.capNhat.so_phien_diem_thap === 2);
  const hoiPhuc = danhGiaLenhMuaChot({ l: { ...l, diem_cuoi: 0.5 }, row: { ma: "GMD", tin: "TRUNG LAP", gia: 76, diem: -1.8 }, ngay: "2026-10-01" });
  ok("phien truoc diem hoi phuc: dem lai tu 0", hoiPhuc.dongMoi.length === 0 && hoiPhuc.capNhat.so_phien_diem_thap === 0);
}
// Cat lo CHI trong khung gio: ngoai khung cham muc cat lo -> giu tiep
ok(
  "ngoai khung cham cat lo: khong cat",
  danhGiaLenhMuaChot({ l: lGMD, row: { ma: "GMD", tin: "TRUNG LAP", gia: 73.4, diem: -0.5 }, ngay: NGAY, trongKhung: false }).dongMoi.length === 0
);
// Gan muc cat lo vao dong cat lo sap ghi
{
  const cu = { vao_stop_loss: 73.508, stop_loss: 72, vao_tp1: 82.11, vao_tp2: 86.02, vao_tp3: 89.93, stop_bao_ve: 78.2 };
  const d = themMucCatLo({ ma: "GMD", ly_do: "CAT_LO", vong: 1, gia_mua: 78.2 }, cu);
  ok("cat lo: muc cat lo = stop dong bang luc mua", d.muc_cat_lo === 73.508 && d.stop_goc === 73.508 && d.tp1_goc === 82.11);
  ok("hoa von: muc cat lo = stop bao ve", themMucCatLo({ ma: "GMD", ly_do: "BAO_VE_LAI", vong: 1, gia_mua: 78.2 }, cu).muc_cat_lo === 78.2);
  ok("dong thuong: khong gan", themMucCatLo({ ma: "GMD", ly_do: "BAN", vong: 1 }, cu).muc_cat_lo === undefined);
  const lo = themMucCatLo({ ma: "FPT", ly_do: "CAT_LO", vong: 4, gia_mua: 120.5 }, { stop_giua: 115, tp1_giua: 126, tp2_giua: 132 });
  ok("lenh mua moi: dung stop / TP rieng", lo.muc_cat_lo === 115 && lo.tp1_goc === 126);
}
// He thong da dong lenh -> ket thuc
ok("he thong da ghi dong (vong 1) -> ket thuc", danhGiaLenhMuaChot({ l: lGMD, row: { ma: "GMD", tin: "TRUNG LAP", gia: 80 }, daGhi: new Set([1]), ngay: NGAY }).capNhat.trang_thai === "dong");

// Hien o danh sach lenh dang mo (lenhDangMo) khi web giu
{
  const ds = lenhDangMo([{ ma: "GMD", tin: "TRUNG LAP", gia: 77.8, ngay_mua: "2026-08-10", lenh_web: [{ ...lGMD }] }]);
  ok("lenh web giu hien trong lenh dang mo", ds.length === 1 && ds[0].lenh_web === true && ds[0].tin === "NAM GIU" && ds[0].gia_mua === 78.2 && gan(ds[0].lai_lo_pct, (77.8 / 78.2 - 1) * 100));
}


// ===== 2026-10-09: xac nhan 10 phut truoc khi chot + thoat som lenh web giu =====
{
  ok("soPhienGiaoDich: T6 09/10 -> T3 13/10 = 2 phien (bo T7, CN)", soPhienGiaoDich("2026-10-09", "2026-10-13") === 2);
  ok("soPhienGiaoDich: cung ngay = 0, ngay truoc = 0", soPhienGiaoDich("2026-10-09", "2026-10-09") === 0 && soPhienGiaoDich("2026-10-13", "2026-10-09") === 0);
  ok("soPhienGiaoDich: T2 -> T3 = 1", soPhienGiaoDich("2026-10-12", "2026-10-13") === 1);

  const HOM_NAY = "2026-10-09";
  const t0 = Date.parse("2026-10-09T03:30:00Z");
  const phut = (n) => t0 + n * 60e3;
  const moi = { ma: "ANV", loai: "goc", ngay_mua: HOM_NAY, gia_mua: 19.05 };
  const cu = { ma: "VPB", loai: "goc", ngay_mua: "2026-09-21", gia_mua: 20 };
  ok("hang so: xac nhan 10 phut", SO_PHUT_XAC_NHAN_MUA === 10);

  // Lan dau thay: chua chot (cho 10 phut); ung vien cua phien truoc chot ngay.
  let kq = xacNhanUngVien({ ungVien: [moi, cu], ngay: HOM_NAY, bayGioMs: phut(0) });
  ok("lan dau thay tin hieu hom nay: chua chot; lenh phien truoc: chot ngay", kq.duocChot.map((x) => x.ma).join() === "VPB" && kq.theoDoiMoi.size === 1);
  let tdoi = new Map([...kq.theoDoiMoi].map(([k, v]) => [k, { thay_dau: v.thay_dau, thay_cuoi: v.thay_cuoi }]));
  // 9 phut sau, cap nhat deu dan: chua du
  for (let m = 1; m <= 9; m++) {
    kq = xacNhanUngVien({ ungVien: [moi], daTheoDoi: tdoi, ngay: HOM_NAY, bayGioMs: phut(m) });
    tdoi = new Map([...kq.theoDoiMoi].map(([k, v]) => [k, { thay_dau: v.thay_dau, thay_cuoi: v.thay_cuoi }]));
  }
  ok("9 phut: chua du", kq.duocChot.length === 0);
  kq = xacNhanUngVien({ ungVien: [moi], daTheoDoi: tdoi, ngay: HOM_NAY, bayGioMs: phut(10) });
  ok("du 10 phut lien tuc: chot", kq.duocChot.length === 1 && kq.duocChot[0].ma === "ANV");

  // Tin hieu mat o 1 lan cap nhat -> dem lai tu dau
  const sauMat = xacNhanUngVien({ ungVien: [], daTheoDoi: tdoi, ngay: HOM_NAY, bayGioMs: phut(6) });
  ok("tin hieu mat: bang theo doi bi xoa", sauMat.theoDoiMoi.size === 0);
  const hienLai = xacNhanUngVien({ ungVien: [moi], daTheoDoi: sauMat.theoDoiMoi, ngay: HOM_NAY, bayGioMs: phut(7) });
  const tdHienLai = new Map([...hienLai.theoDoiMoi].map(([k, v]) => [k, { thay_dau: v.thay_dau, thay_cuoi: v.thay_cuoi }]));
  let tdLoop = tdHienLai;
  let chotLoop = null;
  const dem = {};
  for (let m = 8; m <= 17; m++) {
    const r = xacNhanUngVien({ ungVien: [moi], daTheoDoi: tdLoop, ngay: HOM_NAY, bayGioMs: phut(m) });
    tdLoop = new Map([...r.theoDoiMoi].map(([k, v]) => [k, { thay_dau: v.thay_dau, thay_cuoi: v.thay_cuoi }]));
    dem[m] = r.duocChot.length;
  }
  ok("hien lai o phut 7: den phut 16 chua chot (9 phut), phut 17 chot (du 10 phut ke tu luc hien lai)", dem[16] === 0 && dem[17] === 1, JSON.stringify(dem));

  // Cach nhau qua 5 phut giua 2 lan cap nhat (nghi trua, engine tat) coi la dut
  const tdCu = new Map([["ANV|goc|" + HOM_NAY, { thay_dau: phut(0), thay_cuoi: phut(2) }]]);
  const dut = xacNhanUngVien({ ungVien: [moi], daTheoDoi: tdCu, ngay: HOM_NAY, bayGioMs: phut(20) });
  ok("cach 18 phut khong cap nhat: dem lai tu dau", dut.duocChot.length === 0 && dut.theoDoiMoi.get("ANV|goc|" + HOM_NAY).thay_dau === phut(20));

  // THOAT SOM lenh web giu
  const lWeb = { ma: "VIC", loai: "giua", ngay_mua: "2026-10-06", gia_mua: 232.5, stop_loss: 222.63, tp1: 255.75, tp2: 270, tp3: 300, so_phien_diem_thap: 0, ngay_diem: null, diem_cuoi: null, tp_da_cham: null, web_giu: true, web_giu_tu: "2026-10-09" };
  const rowVic = { ma: "VIC", tin: "NAM GIU", gia: 225.5, diem: -0.35, ngay_mua: "2026-09-01", dang_giu_giua: false };
  let k = danhGiaLenhMuaChot({ l: lWeb, row: rowVic, ngay: "2026-10-12" });
  ok("web giu 1 phien, gia duoi gia mua: chua thoat", k.dongMoi.length === 0 && k.capNhat.web_giu_tu === "2026-10-09");
  k = danhGiaLenhMuaChot({ l: lWeb, row: rowVic, ngay: "2026-10-13" });
  ok("web giu 2 phien, chua cham TP1, gia duoi gia mua: THOAT_SOM", k.dongMoi.length === 1 && k.dongMoi[0].ly_do === "THOAT_SOM" && k.dongMoi[0].phan_chot_pct === 100 && k.dongMoi[0].vong === 4 && k.capNhat.trang_thai === "dong", JSON.stringify(k.dongMoi));
  k = danhGiaLenhMuaChot({ l: lWeb, row: { ...rowVic, gia: 233 }, ngay: "2026-10-13" });
  ok("web giu 2 phien nhung gia tren gia mua: giu tiep", k.dongMoi.length === 0 && k.capNhat.web_giu === true);
  k = danhGiaLenhMuaChot({ l: { ...lWeb, tp_da_cham: "TP1" }, row: rowVic, ngay: "2026-10-13" });
  ok("da cham TP1: khong thoat som (de cat lo / hoa von xu ly)", !k.dongMoi.some((d) => d.ly_do === "THOAT_SOM"));
  k = danhGiaLenhMuaChot({ l: { ...lWeb, web_giu_tu: null }, row: rowVic, ngay: "2026-10-13" });
  ok("lenh web giu cu chua co web_giu_tu: bat dau dem tu hom nay", k.dongMoi.length === 0 && k.capNhat.web_giu_tu === "2026-10-13");
  k = danhGiaLenhMuaChot({ l: lWeb, row: { ...rowVic, dang_giu_giua: true, ngay_mua_giua: "2026-10-06" }, ngay: "2026-10-13" });
  ok("he thong giu lai dung lenh: web_giu false, xoa web_giu_tu", k.capNhat.web_giu === false && k.capNhat.web_giu_tu === null);
  k = danhGiaLenhMuaChot({ l: lWeb, row: { ...rowVic, gia: 222 }, ngay: "2026-10-13", trongKhung: true });
  ok("cat lo van uu tien hon thoat som", k.dongMoi[0].ly_do === "CAT_LO");
}
console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
