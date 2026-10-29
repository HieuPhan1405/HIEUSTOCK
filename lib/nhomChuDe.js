// NHOM CHU DE (Hieu 29/10/2026: "web chua co nhom nganh dau tu cong a") - cac ma co the thuoc NHIEU nhom va KHONG thay cho phan loai nganh (lib/nganh.js, moi ma 1 nganh duy nhat).
// Danh sach la DU THAO do em chon theo hoat dong chinh (xay lap ha tang giao thong / BOT, vat lieu xay dung cung cap cho cong trinh cong, thep xay dung): Hieu sua truc tiep o day
// (them / bot ma) roi day len - khong can sua cho khac. Ma khong co trong ~390 ma web quet thi giao dien tu bo qua.
export const NHOM_CHU_DE = {
  dau_tu_cong: {
    nhan: "Đầu tư công",
    moTa: "Cổ phiếu hưởng lợi từ giải ngân đầu tư công (cao tốc, hạ tầng giao thông, năng lượng): xây lắp hạ tầng / BOT, vật liệu và thép xây dựng. Danh sách dự thảo, có thể sửa.",
    ma: [
      // Xay lap, ha tang giao thong, BOT
      "HHV", "LCG", "FCN", "VCG", "CII", "HUT", "DPG", "PHC", "TV2", "CTI", "PC1",
      // Vat lieu xay dung cung cap cho cong trinh (da, nhua duong, xi mang, gach / vat lieu)
      "KSB", "PLC", "HT1", "DHA", "VGC",
      // Thep xay dung
      "HPG", "HSG", "NKG",
    ],
  },
};

export const DS_CHU_DE = Object.keys(NHOM_CHU_DE);

// Cac khoa nhom chu de ma `ma` thuoc ve (mang, co the rong).
export function chuDeCuaMa(ma) {
  const m = String(ma || "").toUpperCase();
  return DS_CHU_DE.filter((k) => NHOM_CHU_DE[k].ma.includes(m));
}
