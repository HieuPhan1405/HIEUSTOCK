// Test tay cho lib/khungGioVaoLenh.js (chot ban theo khung gio vao lenh). Chay: node engine/test/khungGioVaoLenh.test.mjs
import { dangTrongKhungVaoLenh, batDauKhungKeTiep, daDenLucChot, nhanKhungKeTiep, canChoKhung, xuLyLenhTheoDoi, batDauKhungHienTai, catLoCanChoKhung, muaDangTheoDoi, dangTrongPhienDinhKyMoCua } from "../../lib/khungGioVaoLenh.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
// Gio Viet Nam -> Date (UTC+7). 2026-09-25 la thu Sau, 26 thu Bay, 28 thu Hai.
const vn = (s) => new Date(`${s}:00+07:00`);
const gioVN = (d) => new Date(d.getTime() + 7 * 3600e3).toISOString().slice(0, 16).replace("T", " ");

ok("10:45 trong khung", dangTrongKhungVaoLenh(vn("2026-09-25T10:45")));
ok("11:30 het khung sang", !dangTrongKhungVaoLenh(vn("2026-09-25T11:30")));
ok("14:44 trong khung chieu", dangTrongKhungVaoLenh(vn("2026-09-25T14:44")));
ok("thu Bay khong co khung", !dangTrongKhungVaoLenh(vn("2026-09-26T10:45")));

ok("09:40 -> khung 10:30 cung ngay", gioVN(batDauKhungKeTiep(vn("2026-09-25T09:40"))) === "2026-09-25 10:30");
ok("11:40 -> khung 14:00", gioVN(batDauKhungKeTiep(vn("2026-09-25T11:40"))) === "2026-09-25 14:00");
ok("14:50 thu Sau -> 10:30 thu Hai", gioVN(batDauKhungKeTiep(vn("2026-09-25T14:50"))) === "2026-09-28 10:30", gioVN(batDauKhungKeTiep(vn("2026-09-25T14:50"))));
ok("dang trong khung 10:45 -> khung sau la 14:00", gioVN(batDauKhungKeTiep(vn("2026-09-25T10:45"))) === "2026-09-25 14:00");

ok("ghi 09:40, luc 10:20 chua chot", !daDenLucChot(vn("2026-09-25T09:40"), vn("2026-09-25T10:20")));
ok("ghi 09:40, luc 10:31 chot", daDenLucChot(vn("2026-09-25T09:40"), vn("2026-09-25T10:31")));
ok("ghi 14:50 thu Sau, chieu thu Sau 15:30 chua chot", !daDenLucChot(vn("2026-09-25T14:50"), vn("2026-09-25T15:30")));
ok("ghi 14:50 thu Sau, chi day len sau gio dong cua thu Hai 15:30 van chot (khong treo mai)", daDenLucChot(vn("2026-09-25T14:50"), vn("2026-09-28T15:30")));

ok("nhan cung ngay", nhanKhungKeTiep(vn("2026-09-25T11:40"), vn("2026-09-25T12:00")) === "14:00");
ok("nhan phien sau", nhanKhungKeTiep(vn("2026-09-25T14:50"), vn("2026-09-25T15:00")) === "10:30 phiên sau");
ok("sang hom sau truoc 10:30: cung ngay", nhanKhungKeTiep(vn("2026-09-25T14:50"), vn("2026-09-28T09:15")) === "10:30");

ok("ban theo tin hieu / cat lo phai cho khung", ["BAN", "THOAT", "THOAT_KIJUN", "CAT_LO", "BAO_VE_LAI"].every(canChoKhung));
ok("chot TP khong cho khung", !["TP1", "TP2", "TP3", "CHOT_TP3"].some(canChoKhung));

// Cat lo chi trong khung gio (GMD 14/09/2026: cham 73,5 luc 13:45 ngoai khung, 14:00-14:45 gia 73,6+ -> khong cat)
{
  const d = { ly_do: "CAT_LO", muc_cat_lo: 73.508, thay_trong_khung: false, tao_luc: vn("2026-09-14T13:45") };
  ok("13:50 ngoai khung: cho", xuLyLenhTheoDoi(d, 73.5, vn("2026-09-14T13:50")).ketQua === "cho");
  const k1 = xuLyLenhTheoDoi(d, 73.7, vn("2026-09-14T14:05"));
  ok("14:05 trong khung gia tren muc cat lo: cho + da thay trong khung", k1.ketQua === "cho" && k1.thayTrongKhung === true);
  ok("14:12 trong khung gia <= muc cat lo: chot", xuLyLenhTheoDoi(d, 73.5, vn("2026-09-14T14:12")).ketQua === "chot");
  ok("14:50 het khung, da thay trong khung chua cham: HUY", xuLyLenhTheoDoi({ ...d, thay_trong_khung: true }, 74.6, vn("2026-09-14T14:50")).ketQua === "huy");
  ok("khong co cap nhat trong khung, hom sau sau gio dong cua: chot (du phong)", xuLyLenhTheoDoi(d, 74.9, vn("2026-09-15T15:30")).ketQua === "chot");
  const ban = { ly_do: "BAN", tao_luc: vn("2026-09-14T13:45") };
  ok("ban theo tin hieu: cho den khung", xuLyLenhTheoDoi(ban, 70, vn("2026-09-14T13:55")).ketQua === "cho");
  ok("ban theo tin hieu: tu 14:00 chot bat ke gia", xuLyLenhTheoDoi(ban, 80, vn("2026-09-14T14:01")).ketQua === "chot");
}

// Cat lo phat hien trong khung nhung lan cap nhat truoc o truoc khung (cham luc 9:20, cap nhat dau tien 10:31, gia da hoi)
ok("khung hien tai 10:45 -> 10:30", gioVN(batDauKhungHienTai(vn("2026-09-14T10:45"))) === "2026-09-14 10:30" && batDauKhungHienTai(vn("2026-09-14T12:00")) === null);
ok(
  "cham truoc khung, gia da hoi: chua cat (cho)",
  catLoCanChoKhung({ lyDo: "CAT_LO", gia: 74.6, mucCatLo: 73.508, lucTruoc: vn("2026-09-14T09:10"), bayGio: vn("2026-09-14T10:31") })
);
ok(
  "lan truoc cung trong khung (cham giua 2 lan cap nhat): cat ngay",
  !catLoCanChoKhung({ lyDo: "CAT_LO", gia: 73.6, mucCatLo: 73.508, lucTruoc: vn("2026-09-14T10:44"), bayGio: vn("2026-09-14T10:45") })
);
ok("gia van duoi muc cat lo: cat ngay", !catLoCanChoKhung({ lyDo: "CAT_LO", gia: 73.4, mucCatLo: 73.508, lucTruoc: vn("2026-09-14T09:10"), bayGio: vn("2026-09-14T10:31") }));
ok("ban theo tin hieu: khong ap dung", !catLoCanChoKhung({ lyDo: "BAN", gia: 80, mucCatLo: 73.508, lucTruoc: vn("2026-09-14T09:10"), bayGio: vn("2026-09-14T10:31") }));

// Mua chi chot trong khung: MUA luc 14:50 thu Sau (ngoai khung) -> sang thu Hai he thong NAM GIU van THEO DOI den 10:30
{
  const tu = vn("2026-09-25T14:50");
  ok("MUA ngoai khung: theo doi", muaDangTheoDoi({ tin: "MUA", trongKhung: false }));
  ok("MUA trong khung: khong theo doi", !muaDangTheoDoi({ tin: "MUA", trongKhung: true }));
  ok("NAM GIU chua chot mua, 9:20 thu Hai: theo doi", muaDangTheoDoi({ tin: "NAM GIU", muaTheoDoiTu: tu, trongKhung: false, bayGio: vn("2026-09-28T09:20") }));
  ok("NAM GIU chua chot mua, trong khung: het theo doi (chot)", !muaDangTheoDoi({ tin: "NAM GIU", muaTheoDoiTu: tu, trongKhung: true, bayGio: vn("2026-09-28T10:35") }));
  ok("NAM GIU chua chot mua, sau khung (khong co cap nhat trong khung): coi nhu da chot", !muaDangTheoDoi({ tin: "NAM GIU", muaTheoDoiTu: tu, trongKhung: false, bayGio: vn("2026-09-28T15:30") }));
  ok("NAM GIU da chot mua (khong co moc theo doi): binh thuong", !muaDangTheoDoi({ tin: "NAM GIU", muaTheoDoiTu: null, trongKhung: false }));
  ok("MUA da chot mua luc 10:53, 13:00 van MUA: khong quay lai THEO DOI", !muaDangTheoDoi({ tin: "MUA", daChotMua: true, trongKhung: false }));
}

// Tin hieu chi tu 9h15: 9:00-9:15 (ATO) khong tinh/upload tin hieu
{
  ok("08:59 chua vao phien: khong chan (du lieu hom qua, khong doi)", !dangTrongPhienDinhKyMoCua(vn("2026-09-25T08:59")));
  ok("09:00 thu Sau: chan", dangTrongPhienDinhKyMoCua(vn("2026-09-25T09:00")));
  ok("09:14 thu Sau: chan", dangTrongPhienDinhKyMoCua(vn("2026-09-25T09:14")));
  ok("09:15 thu Sau: bat dau tin hieu", !dangTrongPhienDinhKyMoCua(vn("2026-09-25T09:15")));
  ok("10:45 trong khung: khong chan", !dangTrongPhienDinhKyMoCua(vn("2026-09-25T10:45")));
  ok("buoi toi 20:00 (AmiBroker day len): khong chan", !dangTrongPhienDinhKyMoCua(vn("2026-09-25T20:00")));
  ok("thu Bay 09:05: khong co phien, khong chan", !dangTrongPhienDinhKyMoCua(vn("2026-09-26T09:05")));
  ok("chu nhat 09:05: khong chan", !dangTrongPhienDinhKyMoCua(vn("2026-09-27T09:05")));
}

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
