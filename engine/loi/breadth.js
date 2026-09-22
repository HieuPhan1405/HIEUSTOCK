// Port AFL dong 350-450: TinhBreadth() + BreadthPctNganh (chon dung nganh theo THU TU UU TIEN,
// ma nao khong thuoc nganh nao ca dung trung binh 15 nganh - "Breadth_TB_Chung").
// LUU Y ve mau so: AFL luon chia cho SO LUONG CO DINH cua danh sach (SoLuong tham so cua
// TinhBreadth), KHONG phai so ma THUC SU tim duoc du lieu - ma nao thieu du lieu (gia/MA50) chi
// don gian KHONG duoc cong vao tu so, van tinh trong mau so. Ham duoi day lam dung y het.
import { NGANH, nganhCuaMa } from "../danh-sach/nganh.js";

// layDuLieu(ma) -> { gia, ma50 } | undefined - can co san gia hien tai + MA(50) cua CA RO ~400 ma
// (tinh 1 lan cho toan bo thi truong, khong the tinh rieng tung ma doc lap).
export function tinhTatCaBreadth(layDuLieu) {
  const theoNganh = new Map();
  for (const [ten, ds] of NGANH) {
    let dem = 0;
    for (const ma of ds) {
      const d = layDuLieu(ma);
      if (d && d.gia != null && d.ma50 != null && d.gia > d.ma50) dem++;
    }
    theoNganh.set(ten, (dem / ds.size) * 100);
  }
  const tong = [...theoNganh.values()].reduce((a, b) => a + b, 0);
  const trungBinh = tong / theoNganh.size;
  return { theoNganh, trungBinh };
}

// breadth_nganh CUA 1 MA CU THE: % cua NGANH no thuoc (uu tien dau tien neu nam trong > 1 danh
// sach - xem nganhCuaMa), hoac trung binh 15 nganh neu khong thuoc nganh nao ("Khac").
export function breadthCuaMa(ma, { theoNganh, trungBinh }) {
  const ten = nganhCuaMa(ma);
  return ten != null ? theoNganh.get(ten) : trungBinh;
}
