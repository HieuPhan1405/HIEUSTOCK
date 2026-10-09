// LAM SACH DU LIEU TIN HIEU CHO KHACH (2026-10-09) - ham THUAN (import tuong doi de test tay: engine/test/lamSachChoKhach.test.mjs).
// Truoc day /api/signals va du lieu truyen cho trang Bo loc tra NGUYEN dong tin_hieu cho moi nguoi (tin MUA/BAN, gia mua, cat lo, TP...) - giao dien chi lam mo cot "Tin hieu" nen ai mo
// DevTools / goi API deu doc duoc. Khach CHUA dang nhap hoac CHUA duoc duyet chi nhan cac truong trong DANH SACH CHO PHEP (allowlist - truong moi them mac dinh bi AN); thanh vien da duyet
// va khoa API nhan day du. Cach nay chi lam sach o BIEN GIOI tra ra ngoai; DB, engine, thong bao, lenh... van dung du lieu day du.
const CHO_PHEP = new Set([
  "ma", "ten_cong_ty", "ten_ngan", "san", "nganh", "von_hoa", "von_hoa_ty",
  "gia", "doi", "diem", "trend", "mom", "dt", "adx", "rs_vni", "breadth_nganh",
  "kijun", "gg_top", "gg_bot", "dinh_52t", "gtgd_tb20", "khoi_luong_tb20", "fvg_ok",
  "sanyaku", "kumo_twist", "ngay_bien_doi", "mat_than", "diem_rank", "diem_confidence", "cap_nhat_luc",
]);

// Mot dong cho khach. tinGiaDinh: neu truyen (vd "TRUNG LAP") thi gan vao cot tin (giao dien Bo loc can co gia tri de ve cot) - khong truyen thi bo han truong tin.
export function lamSachMotDong(row, { tinGiaDinh = null } = {}) {
  const ra = {};
  for (const k of CHO_PHEP) if (k in row) ra[k] = row[k];
  if (tinGiaDinh != null) ra.tin = tinGiaDinh;
  return ra;
}

export function lamSachChoKhach(ds, tuyChon) {
  return ds.map((r) => lamSachMotDong(r, tuyChon));
}

export const TRUONG_KHACH_THAY = [...CHO_PHEP];
