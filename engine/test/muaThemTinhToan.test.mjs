// Test tay cho lib/muaThemTinhToan.js (bang "Diem mua moi" o So lenh dang mo). Chay: node engine/test/muaThemTinhToan.test.mjs
import { phanConLaiLenhGoc, giaVonTrungBinh, cacDiemMuaMoi, ketQuaDiemMua, ngayChuoi, gopLenhMo, dongTuDiemMua, nhanDongMuaThem, lenhDangMo } from "../../lib/muaThemTinhToan.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
const gan = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

ok("con lai goc: chua TP = 100", phanConLaiLenhGoc(null) === 100);
ok("con lai goc: TP1 = 70", phanConLaiLenhGoc("TP1") === 70);
ok("con lai goc: TP2 = 40", phanConLaiLenhGoc("TP2") === 40);
ok("con lai goc: TP3 = 15", phanConLaiLenhGoc("TP3") === 15);

// 15% gia 20 + 100 gia 22 => (15*20 + 100*22)/115 = 2500/115
const tb = giaVonTrungBinh({ conLaiPct: 15, giaMuaGoc: 20, giaMuaMoi: 22 });
ok("gia von TB sau TP3: (15x20+100x22)/115", gan(tb, 2500 / 115), String(tb));
ok("gia von TB giua chung chua TP: 50/50", gan(giaVonTrungBinh({ conLaiPct: 100, giaMuaGoc: 20, giaMuaMoi: 24 }), 22));
ok("gia von TB: khoi luong mua them tuy chinh 50", gan(giaVonTrungBinh({ conLaiPct: 100, giaMuaGoc: 20, giaMuaMoi: 24, khoiLuongMoiPct: 50 }), (100 * 20 + 50 * 24) / 150));
ok("gia von TB: thieu gia goc -> null", giaVonTrungBinh({ conLaiPct: 15, giaMuaGoc: null, giaMuaMoi: 22 }) === null);
ok("gia von TB: gia moi = 0 -> null", giaVonTrungBinh({ conLaiPct: 15, giaMuaGoc: 20, giaMuaMoi: 0 }) === null);

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
ok("diem: con lai goc 15, gia goc 20", d[0].conLaiGocPct === 15 && d[0].giaMuaGoc === 20);
ok("diem: SL/TP", d[0].stop === 20.5 && d[0].tp1 === 24 && d[0].tp3 === 29);

let kq = ketQuaDiemMua(d[0], false);
ok("chua mua dot dau -> MUA MOI, von = gia mua moi", kq.muaThem === false && kq.giaVon === 22 && gan(kq.laiLoPct, (24 / 22 - 1) * 100));
kq = ketQuaDiemMua(d[0], true);
ok("da mua dot dau -> MUA THEM, von trung binh", kq.muaThem === true && gan(kq.giaVon, 2500 / 115) && gan(kq.laiLoPct, (24 / (2500 / 115) - 1) * 100) && kq.tinhDuocTrungBinh);
kq = ketQuaDiemMua(d[0], undefined);
ok("chua chon (undefined) coi nhu MUA MOI", kq.muaThem === false && kq.giaVon === 22);

// Ca 2 vi the phu cung luc
const row2 = { ...row, tp_da_cham: "TP1", mua_giua: false, dang_giu_giua: true, gia_mua_giua: 21, stop_giua: 19, ngay_mua_giua: new Date(Date.UTC(2026, 8, 20)) };
d = cacDiemMuaMoi(row2);
ok("2 diem mua moi (moi + giua)", d.length === 2 && d[1].vong === "giua" && d[1].khoa === "ABC|giua|2026-09-20" && d[1].conLaiGocPct === 70, JSON.stringify(d.map((x) => x.khoa)));
ok("giua chung: khong hom nay", d[1].homNay === false);

// Khong bao co -> khong co diem
ok("khong co co bao -> rong", cacDiemMuaMoi({ ma: "X", gia: 10, gia_mua: 9, dang_giu_moi: false, mua_moi: false }).length === 0);
ok("thieu gia mua rieng -> bo", cacDiemMuaMoi({ ma: "X", gia: 10, gia_mua: 9, dang_giu_moi: true, gia_mua_moi: null, ngay_mua_moi: "2026-09-24" }).length === 0);
ok("thieu ngay mua rieng -> bo", cacDiemMuaMoi({ ma: "X", gia: 10, gia_mua: 9, dang_giu_moi: true, gia_mua_moi: 9.5 }).length === 0);
// Thieu gia mua goc: van hien, mua them lui ve gia mua moi + danh dau khong tinh duoc TB
d = cacDiemMuaMoi({ ma: "X", gia: 10, gia_mua: null, dang_giu_moi: true, gia_mua_moi: 9.5, ngay_mua_moi: "2026-09-24", tp_da_cham: "TP3" });
kq = ketQuaDiemMua(d[0], true);
ok("thieu gia goc: lui ve gia mua moi, tinhDuocTrungBinh=false", kq.giaVon === 9.5 && kq.tinhDuocTrungBinh === false);

// GOP lenh goc + diem mua them thanh 1 danh sach (1 ma co the co 2-3 dong)
{
  const goc = (ma, them = {}) => ({ ma, tin: "NAM GIU", gia: 24, gia_mua: 20, ngay_mua: "2026-09-10", stop_loss: 18, tp1: 22, tp2: 25, tp3: 29, tp_da_cham: "TP1", lai_lo_pct: 20, mat_than: false, ban_bot: true, ...them });
  const chiGoc = goc("AAA");
  const coGiua = goc("BBB", { mua_giua: true, dang_giu_giua: true, gia_mua_giua: 23, stop_giua: 21, tp1_giua: 25, tp2_giua: 27, tp3_giua: 30, ngay_mua_giua: "2026-09-24" });
  const co2 = goc("CCC", { dang_giu_moi: true, gia_mua_moi: 22, stop_moi: 20.5, tp1_moi: 24, tp2_moi: 26, tp3_moi: 29, ngay_mua_moi: "2026-09-20", dang_giu_giua: true, gia_mua_giua: 21, ngay_mua_giua: "2026-09-15" });
  const ds = gopLenhMo([chiGoc, coGiua, co2]);
  ok("gop: 1 + 2 + 3 = 6 dong", ds.length === 6, String(ds.length));
  ok("gop: thu tu goc roi diem mua them cua cung ma", ds.map((x) => x.khoa_lenh).join() === "AAA,BBB,BBB|giua|2026-09-24,CCC,CCC|moi|2026-09-20,CCC|giua|2026-09-15", ds.map((x) => x.khoa_lenh).join());
  // co_mua_them chi dem mua them GIUA CHUNG (lenh moi sau TP3 la lenh binh thuong: sau_tp3, khong phai mua them)
  ok("gop: dong goc danh dau co_mua_them (chi giua chung)", ds[0].co_mua_them === 0 && ds[1].co_mua_them === 1 && ds[3].co_mua_them === 1 && ds.filter((x) => !x.la_mua_them).length === 4);
  ok("gop: lenh moi sau TP3 la dong binh thuong (sau_tp3, khong la_mua_them)", ds[4].sau_tp3 === true && ds[4].la_mua_them === false && ds[4].loai_mua_them === "moi" && ds[5].la_mua_them === true && ds[5].sau_tp3 === false);
  const m = ds[2];
  ok("dong mua them: gia mua/SL/TP RIENG", m.la_mua_them && m.loai_mua_them === "giua" && m.gia_mua === 23 && m.stop_loss === 21 && m.tp1 === 25 && m.tp3 === 30 && m.ngay_mua === "2026-09-24");
  ok("dong mua them: lai/lo theo gia mua them", gan(m.lai_lo_pct, (24 / 23 - 1) * 100));
  ok("dong mua them: hom nay -> tin MUA", m.tin === "MUA" && m.mua_them_hom_nay === true && ds[5].tin === "NAM GIU");
  ok("dong mua them: khong ke thua co bao lenh goc", m.tp_da_cham === null && m.ban_bot === false && m.dang_giu_giua === null && m.dang_giu_moi === null);
  ok("dong mua them: nho gia/ngay lenh goc de ghi chu", m.gia_mua_goc === 20 && m.ngay_mua_goc === "2026-09-10");
  ok("dong goc khong bi doi", ds[1].gia_mua === 20 && ds[1].tp_da_cham === "TP1" && ds[1].lai_lo_pct === 20 && ds[1].ban_bot === true);
  ok("nhan dong mua them", nhanDongMuaThem(ds[2]) === "Mua thêm giữa chừng" && nhanDongMuaThem(ds[4]) === null && nhanDongMuaThem(ds[0]) === null);
  ok("thieu gia hien tai: lai/lo null", dongTuDiemMua({ ...chiGoc, ma: "Z" }, { khoa: "Z|giua|2026-09-24", vong: "giua", ngay: "2026-09-24", homNay: false, giaMua: 10, gia: null, giaMuaGoc: 9 }).lai_lo_pct === null);
  ok("danh sach rong -> rong", gopLenhMo([]).length === 0);

  // lenhDangMo: ma da ve TRUNG LAP (vd cham TP3 = ket thuc lenh) khong con lenh goc nhung van giu lenh phu dang giu
  const tl = { ...goc("DDD", { tin: "TRUNG LAP", tp_da_cham: "TP3" }) };
  const tlCoLenhMoi = { ...goc("EEE", { tin: "TRUNG LAP", tp_da_cham: "TP3", dang_giu_moi: true, gia_mua_moi: 22, ngay_mua_moi: "2026-09-20" }) };
  const dm = lenhDangMo([chiGoc, tl, tlCoLenhMoi, coGiua]);
  ok("lenhDangMo: bo lenh goc cua ma trung lap", !dm.some((x) => x.ma === "DDD"));
  ok("lenhDangMo: ma trung lap nhung con lenh moi sau TP3 dang giu -> chi giu dong lenh moi", dm.filter((x) => x.ma === "EEE").length === 1 && dm.find((x) => x.ma === "EEE").sau_tp3 === true);
  ok("lenhDangMo: lenh goc dang giu van co (kem lenh mua them)", dm.filter((x) => x.ma === "AAA").length === 1 && dm.filter((x) => x.ma === "BBB").length === 2);
}

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
