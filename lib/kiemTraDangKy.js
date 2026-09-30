// KIEM TRA THONG TIN DANG KY (ham THUAN, khong dung DB/server - dung chung o may chu lib/nguoiDung.js va o form trinh duyet components/ModalTaiKhoan.js
// de 2 ben bao loi GIONG NHAU). Moi ham tra ve chuoi loi tieng Viet, hoac null neu hop le.

export const MK_TOI_THIEU = 8;
export const MK_TOI_DA = 72; // bcrypt chi doc 72 byte dau - qua dai se bi cat am tham, nen khong cho nhap

export function kiemTraTen(ten) {
  const t = String(ten ?? "").trim();
  if (t.length < 2) return "Vui lòng nhập họ tên (ít nhất 2 ký tự).";
  if (t.length > 100) return "Họ tên quá dài (tối đa 100 ký tự).";
  return null;
}

// Chuan hoa email: bo khoang trang, ve chu thuong. Tra ve chuoi da chuan hoa, hoac null neu khong hop le.
export function chuanHoaEmail(email) {
  const e = String(email ?? "").trim().toLowerCase();
  if (e.length < 6 || e.length > 254) return null;
  if (!/^[a-z0-9._%+-]+@([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(e)) return null;
  if (e.includes("..") || e.startsWith(".") || e.split("@")[0].endsWith(".")) return null;
  return e;
}

export function kiemTraEmail(email) {
  return chuanHoaEmail(email) ? null : "Gmail/email chưa đúng định dạng (ví dụ: ten@gmail.com).";
}

// Mat khau: 8-72 ky tu, co CA chu va so, khong thuoc nhom qua de doan, khong trung so dien thoai / phan dau email.
const MAT_KHAU_DE_DOAN = new Set([
  "password1", "password12", "password123", "matkhau123", "matkhau1234", "qwerty123", "qwerty1234", "abc12345", "abcd1234", "abcd12345",
  "admin123", "admin1234", "iloveyou1", "12345678a", "a12345678", "a1234567", "1234567a", "letmein123", "welcome123", "cloudstock1",
]);
export function kiemTraMatKhau(matKhau, { sdt, email } = {}) {
  const mk = String(matKhau ?? "");
  if (mk.length < MK_TOI_THIEU) return `Mật khẩu cần ít nhất ${MK_TOI_THIEU} ký tự.`;
  if (new TextEncoder().encode(mk).length > MK_TOI_DA) return `Mật khẩu quá dài (tối đa ${MK_TOI_DA} ký tự).`;
  if (!/[A-Za-zÀ-ỹ]/.test(mk) || !/\d/.test(mk)) return "Mật khẩu cần gồm cả chữ và số.";
  const thap = mk.toLowerCase();
  if (MAT_KHAU_DE_DOAN.has(thap)) return "Mật khẩu này quá dễ đoán, vui lòng chọn mật khẩu khác.";
  if (sdt && thap.replace(/\D/g, "") === String(sdt).replace(/\D/g, "") && /^\d+$/.test(thap)) return "Mật khẩu không nên trùng số điện thoại.";
  const phanDau = String(email ?? "").split("@")[0].toLowerCase();
  if (phanDau.length >= 4 && thap === phanDau) return "Mật khẩu không nên trùng phần đầu của Gmail.";
  return null;
}

// Do manh mat khau cho thanh hien thi o form: 0 (trong) .. 4 (manh). Chi de goi y, viec chan that nam o kiemTraMatKhau.
export function doManhMatKhau(matKhau) {
  const mk = String(matKhau ?? "");
  if (!mk) return 0;
  let d = 0;
  if (mk.length >= MK_TOI_THIEU) d++;
  if (mk.length >= 12) d++;
  if (/[A-Za-zÀ-ỹ]/.test(mk) && /\d/.test(mk)) d++;
  if (/[^A-Za-z0-9À-ỹ]/.test(mk) || (/[a-zà-ỹ]/.test(mk) && /[A-ZÀ-Ỹ]/.test(mk))) d++;
  return Math.min(d, 4);
}
