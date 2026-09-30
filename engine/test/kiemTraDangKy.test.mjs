// Test tay cho lib/kiemTraDangKy.js (luat dang ky dung chung may chu + form) va lib/loiAnToan.js. Chay: node engine/test/kiemTraDangKy.test.mjs
import { kiemTraTen, chuanHoaEmail, kiemTraEmail, kiemTraMatKhau, doManhMatKhau } from "../../lib/kiemTraDangKy.js";
import { LoiNguoiDung, thongBaoLoi } from "../../lib/loiAnToan.js";

let loi = 0;
const ok = (ten, dk, them = "") => {
  if (!dk) {
    loi++;
    console.log("SAI:", ten, them);
  } else console.log("ok:", ten);
};

// Ho ten
ok("ten hop le", kiemTraTen("Phan Hiếu") === null);
ok("ten rong bi chan", kiemTraTen("  ") !== null);
ok("ten 1 ky tu bi chan", kiemTraTen("A") !== null);
ok("ten qua dai bi chan", kiemTraTen("a".repeat(101)) !== null);

// Email
ok("gmail thuong", chuanHoaEmail("Hieu.Stock+abc@Gmail.com") === "hieu.stock+abc@gmail.com");
ok("khoang trang 2 dau duoc cat", chuanHoaEmail("  a.b@gmail.com ") === "a.b@gmail.com");
for (const x of ["", "abc", "abc@", "@gmail.com", "a@gmail", "a b@gmail.com", "a@@gmail.com", "a..b@gmail.com", ".a@gmail.com", "a.@gmail.com", "a@gmail.c", "a@-.com".concat(" ")]) {
  ok(`email sai bi chan: "${x}"`, chuanHoaEmail(x) === null && kiemTraEmail(x) !== null);
}
ok("email hop le khong bao loi", kiemTraEmail("ten@gmail.com") === null);
ok("email 255 ky tu bi chan", chuanHoaEmail("a".repeat(250) + "@g.com") === null);

// Mat khau
ok("mat khau tot", kiemTraMatKhau("Cloud2026x") === null);
ok("qua ngan", kiemTraMatKhau("abc123") !== null);
ok("chi co so", kiemTraMatKhau("12345678") !== null);
ok("chi co chu", kiemTraMatKhau("abcdefghij") !== null);
ok("de doan", kiemTraMatKhau("Password123") !== null);
ok("trung so dien thoai", kiemTraMatKhau("0912345678", { sdt: "0912345678" }) !== null);
ok("trung phan dau email", kiemTraMatKhau("hieustock1", { email: "hieustock1@gmail.com" }) !== null);
ok("73 ky tu bi chan (bcrypt chi doc 72)", kiemTraMatKhau("a1".repeat(37)) !== null);
ok("72 ky tu duoc", kiemTraMatKhau("a1".repeat(36)) === null);
ok("mat khau tieng Viet co dau + so", kiemTraMatKhau("Mậtkhẩu2026") === null);

// Do manh
ok("do manh: rong = 0", doManhMatKhau("") === 0);
ok("do manh tang theo do phuc tap", doManhMatKhau("abcd1234") < doManhMatKhau("Abcd1234!xyz") && doManhMatKhau("Abcd1234!xyz") === 4);

// Loi an toan
const origLog = console.error;
console.error = () => {};
ok("LoiNguoiDung hien nguyen van", thongBaoLoi(new LoiNguoiDung("Mật khẩu sai")) === "Mật khẩu sai");
process.env.NODE_ENV = "production";
ok("loi he thong o production -> cau chung, khong lo chi tiet", thongBaoLoi(new Error("connection to 10.0.0.1:5432 refused")) === "Có lỗi phía máy chủ, vui lòng thử lại sau ít phút.");
process.env.NODE_ENV = "development";
ok("o dev van hien loi that", thongBaoLoi(new Error("boom")) === "boom");
console.error = origLog;

console.log(loi ? `\n${loi} LOI` : "\nTAT CA DAT");
process.exit(loi ? 1 : 0);
