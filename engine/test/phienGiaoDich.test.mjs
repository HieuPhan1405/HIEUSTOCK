// Test tay cho lib/phienGiaoDich.js (canh bao du lieu cu theo phien giao dich). Chay: node engine/test/phienGiaoDich.test.mjs
import { phienCuaThoiDiem, phienGanNhatDaDong, kiemTraDuLieuCu } from "../../lib/phienGiaoDich.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};
// Gio Viet Nam = UTC+7
const vn = (ngay, gio, phut = 0) => new Date(Date.UTC(Number(ngay.slice(0, 4)), Number(ngay.slice(5, 7)) - 1, Number(ngay.slice(8, 10)), gio - 7, phut));

const thu6 = vn("2026-09-25", 15, 5); // du lieu thu 6 sau dong cua
ok("phien cua du lieu thu 6", phienCuaThoiDiem(thu6) === "2026-09-25");
ok("day len thu 7 -> tinh phien thu 6", phienCuaThoiDiem(vn("2026-09-26", 10)) === "2026-09-25");
ok("CN: phien gan nhat da dong la thu 6", phienGanNhatDaDong(vn("2026-09-27", 20)) === "2026-09-25");
ok("CN: du lieu thu 6 KHONG cu", kiemTraDuLieuCu(thu6, vn("2026-09-27", 20)).cu === false);
ok("sang thu 2 (truoc dong cua): du lieu thu 6 chua cu", kiemTraDuLieuCu(thu6, vn("2026-09-28", 10)).cu === false);
ok("thu 2 sau 15:00: du lieu thu 6 da cu, mong doi phien thu 2", (() => { const r = kiemTraDuLieuCu(thu6, vn("2026-09-28", 16)); return r.cu === true && r.phienMongDoi === "2026-09-28"; })());
ok("thu 2 sau 15:00 da co du lieu thu 2 -> khong cu", kiemTraDuLieuCu(vn("2026-09-28", 15, 10), vn("2026-09-28", 18)).cu === false);
ok("thu 3 sang, du lieu thu 6 -> cu (thieu phien thu 2)", kiemTraDuLieuCu(thu6, vn("2026-09-29", 9, 30)).cu === true);
ok("0h thu 2 (VN): phien gan nhat la thu 6", phienGanNhatDaDong(vn("2026-09-28", 0, 30)) === "2026-09-25");
ok("thoi diem khong hop le -> khong canh bao", kiemTraDuLieuCu("abc", vn("2026-09-28", 16)).cu === false);

console.log(loi === 0 ? "\nTAT CA DAT" : `\n${loi} LOI`);
process.exit(loi === 0 ? 0 : 1);
