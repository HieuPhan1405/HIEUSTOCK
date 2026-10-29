// NHOM CHU DE (Hieu 29/10/2026: "web chua co nhom nganh dau tu cong a") - cac ma co the thuoc NHIEU nhom va KHONG thay cho phan loai nganh (lib/nganh.js, moi ma 1 nganh duy nhat).
// Danh sach "Dau tu cong" theo mau tham khao cua Hieu (29/10/2026, 22 ma, gom ca ma nho / ngoai ~390 ma web quet). Hieu sua truc tiep o day (them / bot ma) roi day len.
// Bang gia / KL cua nhom o trang Nganh (components/BangNhomChuDe.js) lay gia DNSE cho TUNG ma nen co ca ma ngoai danh sach quet; o loc o Bo loc chi tac dung voi ma co trong web.
export const NHOM_CHU_DE = {
  dau_tu_cong: {
    nhan: "Đầu tư công",
    moTa: "Cổ phiếu hưởng lợi từ giải ngân đầu tư công (xây lắp hạ tầng, vật liệu xây dựng cho công trình).",
    ma: ["SD6", "C32", "SD5", "BTS", "HOM", "DHA", "THG", "C47", "G36", "C4G", "CTI", "BCC", "FCN", "LCG", "TV2", "DPG", "HT1", "KSB", "CTD", "VCG", "HHV", "CII"],
  },
};

export const DS_CHU_DE = Object.keys(NHOM_CHU_DE);

// Cac khoa nhom chu de ma `ma` thuoc ve (mang, co the rong).
export function chuDeCuaMa(ma) {
  const m = String(ma || "").toUpperCase();
  return DS_CHU_DE.filter((k) => NHOM_CHU_DE[k].ma.includes(m));
}
