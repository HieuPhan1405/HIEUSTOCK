// LOI AN TOAN DE HIEN RA NGOAI: loi "cho nguoi dung" (vd "Mat khau khong dung") nem bang LoiNguoiDung thi hien nguyen van; moi loi khac (DB, mang, bug...)
// chi ghi vao log may chu va tra cau chung - tranh lo ten bang, dia chi may chu DB, chi tiet ben thu ba ra trinh duyet. O ban dev (khong phai production)
// van hien loi that de de sua.
export class LoiNguoiDung extends Error {
  constructor(thongBao, them = {}) {
    super(thongBao);
    this.name = "LoiNguoiDung";
    Object.assign(this, them);
  }
}

export function thongBaoLoi(e, macDinh = "Có lỗi phía máy chủ, vui lòng thử lại sau ít phút.") {
  if (e instanceof LoiNguoiDung) return e.message;
  console.error("[loi-may-chu]", e);
  return process.env.NODE_ENV === "production" ? macDinh : String(e?.message || e);
}
