// Test tay cho lib/lenhMuaChot.js (lenh mua da chot trong khung gio, web tu giu khi tin hieu mat). Chay: node engine/test/lenhMuaChot.test.mjs
import { ungVienChotMua, danhGiaLenhMuaChot, heThongDangGiu, themMucCatLo } from "../../lib/lenhMuaChot.js";
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

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
