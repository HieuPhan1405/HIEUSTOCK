// Test tay cho lib/muaThemTinhToan.js (bang "Diem mua moi" o So lenh dang mo). Chay: node engine/test/muaThemTinhToan.test.mjs
import { phanConLaiLenhGoc, giaVonTrungBinh, cacDiemMuaMoi, ketQuaDiemMua, ngayChuoi } from "../../lib/muaThemTinhToan.js";

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

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
