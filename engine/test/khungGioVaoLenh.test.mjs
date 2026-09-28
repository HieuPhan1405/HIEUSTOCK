// Test tay cho lib/khungGioVaoLenh.js (chot ban theo khung gio vao lenh). Chay: node engine/test/khungGioVaoLenh.test.mjs
import { dangTrongKhungVaoLenh, batDauKhungKeTiep, daDenLucChot, nhanKhungKeTiep, canChoKhung } from "../../lib/khungGioVaoLenh.js";

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

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
