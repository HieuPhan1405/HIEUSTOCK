// Test tay cho lib/muaThemTinhToan.js (danh sach LENH DANG MO: moi lenh 1 dong rieng, danh so (1)(2) neu 1 ma co nhieu lenh). Chay: node engine/test/muaThemTinhToan.test.mjs
import { cacDiemMuaMoi, ngayChuoi, dongTuDiemMua, lenhDangMo } from "../../lib/muaThemTinhToan.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

ok("ngayChuoi chuoi", ngayChuoi("2026-09-24T00:00:00.000Z") === "2026-09-24");
ok("ngayChuoi Date UTC nua dem", ngayChuoi(new Date(Date.UTC(2026, 8, 24))) === "2026-09-24");
ok("ngayChuoi Date 00:00 gio VN (17:00Z hom truoc)", ngayChuoi(new Date(Date.UTC(2026, 8, 23, 17))) === "2026-09-24");
ok("ngayChuoi null", ngayChuoi(null) === null);

const row = {
  ma: "ABC", gia: 24, gia_mua: 20, tp_da_cham: "TP3",
  mua_moi: true, dang_giu_moi: true, gia_mua_moi: 22, stop_moi: 20.5, tp1_moi: 24, tp2_moi: 26, tp3_moi: 29, ngay_mua_moi: "2026-09-24",
  mua_giua: false, dang_giu_giua: false, gia_mua_giua: null, ngay_mua_giua: null,
};
let d = cacDiemMuaMoi(row);
ok("1 diem mua moi (chi vong moi)", d.length === 1 && d[0].vong === "moi" && d[0].khoa === "ABC|moi|2026-09-24" && d[0].homNay === true, JSON.stringify(d));
ok("diem: gia goc 20, SL/TP rieng", d[0].giaMuaGoc === 20 && d[0].stop === 20.5 && d[0].tp1 === 24 && d[0].tp3 === 29);

// Ca 2 lenh mua moi cung luc
const row2 = { ...row, tp_da_cham: "TP1", mua_giua: false, dang_giu_giua: true, gia_mua_giua: 21, stop_giua: 19, ngay_mua_giua: new Date(Date.UTC(2026, 8, 20)) };
d = cacDiemMuaMoi(row2);
ok("2 diem mua moi (moi + giua)", d.length === 2 && d[1].vong === "giua" && d[1].khoa === "ABC|giua|2026-09-20", JSON.stringify(d.map((x) => x.khoa)));
ok("giua chung: khong hom nay", d[1].homNay === false);

// Khong bao co -> khong co diem
ok("khong co co bao -> rong", cacDiemMuaMoi({ ma: "X", gia: 10, gia_mua: 9, dang_giu_moi: false, mua_moi: false }).length === 0);
ok("thieu gia mua rieng -> bo", cacDiemMuaMoi({ ma: "X", gia: 10, gia_mua: 9, dang_giu_moi: true, gia_mua_moi: null, ngay_mua_moi: "2026-09-24" }).length === 0);
ok("thieu ngay mua rieng -> bo", cacDiemMuaMoi({ ma: "X", gia: 10, gia_mua: 9, dang_giu_moi: true, gia_mua_moi: 9.5 }).length === 0);

// ---- LENH DANG MO: moi lenh 1 dong rieng, danh so theo ngay mua
{
  const goc = (ma, them = {}) => ({ ma, tin: "NAM GIU", gia: 24, gia_mua: 20, ngay_mua: "2026-09-10", stop_loss: 18, tp1: 22, tp2: 25, tp3: 29, tp_da_cham: "TP1", lai_lo_pct: 20, mat_than: false, ban_bot: true, ...them });
  const chiGoc = goc("AAA");
  const coGiua = goc("BBB", { mua_giua: true, dang_giu_giua: true, gia_mua_giua: 23, stop_giua: 21, tp1_giua: 25, tp2_giua: 27, tp3_giua: 30, ngay_mua_giua: "2026-09-24" });
  const co2 = goc("CCC", { dang_giu_moi: true, gia_mua_moi: 22, stop_moi: 20.5, tp1_moi: 24, tp2_moi: 26, tp3_moi: 29, ngay_mua_moi: "2026-09-20", dang_giu_giua: true, gia_mua_giua: 21, ngay_mua_giua: "2026-09-15" });
  const ds = lenhDangMo([chiGoc, coGiua, co2]);
  ok("6 dong: 1 + 2 + 3 lenh", ds.length === 6, String(ds.length));
  ok("thu tu: nhom theo ma, trong ma theo ngay mua", ds.map((x) => x.khoa_lenh).join() === "AAA,BBB,BBB|giua|2026-09-24,CCC,CCC|giua|2026-09-15,CCC|moi|2026-09-20", ds.map((x) => x.khoa_lenh).join());
  ok("danh so: ma 1 lenh -> ten thuong, ma nhieu lenh -> (1) (2) (3)", ds.map((x) => x.ten_lenh).join() === "AAA,BBB (1),BBB (2),CCC (1),CCC (2),CCC (3)", ds.map((x) => x.ten_lenh).join());
  ok("so_lenh / tong_lenh", ds[0].tong_lenh === 1 && ds[1].so_lenh === 1 && ds[2].so_lenh === 2 && ds[5].so_lenh === 3 && ds[5].tong_lenh === 3);
  ok("la_lenh_moi: lenh dau false, lenh mua moi true", ds[0].la_lenh_moi === false && ds[1].la_lenh_moi === false && ds[2].la_lenh_moi === true && ds[4].la_lenh_moi === true);
  const m = ds[2];
  ok("lenh mua moi: gia mua/SL/TP RIENG", m.gia_mua === 23 && m.stop_loss === 21 && m.tp1 === 25 && m.tp3 === 30 && m.ngay_mua === "2026-09-24" && m.loai_lenh_moi === "giua");
  ok("lenh mua moi: lai/lo theo gia mua rieng", gan(m.lai_lo_pct, (24 / 23 - 1) * 100));
  ok("lenh mua moi: hom nay -> tin MUA", m.tin === "MUA" && m.mua_moi_hom_nay === true && ds[4].tin === "NAM GIU");
  ok("lenh mua moi: khong ke thua co bao lenh dau", m.tp_da_cham === null && m.ban_bot === false && m.dang_giu_giua === null && m.dang_giu_moi === null);
  ok("lenh mua moi: nho gia/ngay lenh dau", m.gia_mua_goc === 20 && m.ngay_mua_goc === "2026-09-10");
  ok("lenh dau khong bi doi", ds[1].gia_mua === 20 && ds[1].tp_da_cham === "TP1" && ds[1].lai_lo_pct === 20 && ds[1].ban_bot === true && ds[1].khoa_lenh === "BBB");
  ok("thieu gia hien tai: lai/lo null", dongTuDiemMua({ ...chiGoc, ma: "Z" }, { khoa: "Z|giua|2026-09-24", vong: "giua", ngay: "2026-09-24", homNay: false, giaMua: 10, gia: null, giaMuaGoc: 9 }).lai_lo_pct === null);
  ok("danh sach rong -> rong", lenhDangMo([]).length === 0);

  // ma da ve TRUNG LAP (vd lenh cu cham TP3) khong con lenh dau nhung van giu lenh mua moi dang giu
  const tl = goc("DDD", { tin: "TRUNG LAP", tp_da_cham: "TP3" });
  const tlCoLenhMoi = goc("EEE", { tin: "TRUNG LAP", tp_da_cham: "TP3", dang_giu_moi: true, gia_mua_moi: 22, ngay_mua_moi: "2026-09-20" });
  const dm = lenhDangMo([chiGoc, tl, tlCoLenhMoi, coGiua]);
  ok("ma trung lap: bo lenh dau", !dm.some((x) => x.ma === "DDD"));
  ok("ma trung lap con lenh mua moi dang giu -> chi 1 dong (khong danh so)", dm.filter((x) => x.ma === "EEE").length === 1 && dm.find((x) => x.ma === "EEE").ten_lenh === "EEE" && dm.find((x) => x.ma === "EEE").la_lenh_moi === true);
  ok("lenh dau dang giu van co (kem lenh mua moi)", dm.filter((x) => x.ma === "AAA").length === 1 && dm.filter((x) => x.ma === "BBB").length === 2);
  // lenh mua moi cung ngay voi lenh dau: lenh dau xep truoc
  const cungNgay = lenhDangMo([goc("FFF", { dang_giu_giua: true, gia_mua_giua: 21, ngay_mua_giua: "2026-09-10" })]);
  ok("cung ngay mua: lenh dau (1) truoc lenh mua moi (2)", cungNgay[0].la_lenh_moi === false && cungNgay[1].la_lenh_moi === true && cungNgay[1].ten_lenh === "FFF (2)");
}

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
