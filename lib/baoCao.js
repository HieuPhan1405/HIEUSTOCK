// DANH SACH BAO CAO PHAN TICH (22/11/2026) - muc "Bao cao phan tich" (/bao-cao). Moi bao cao la 1 file HTML tinh + 1 file PDF trong public/bao-cao/ (sinh tu
// Desktop/Phan-Tich-Co-Ban/taoBaoCaoDN_FPT.mjs), trang /bao-cao/[slug] nhung file HTML bang khung (components/KhungBaoCao.js). Them bao cao moi: copy 2 file vao
// public/bao-cao/, them 1 phan tu vao BAO_CAO (moi nhat dau tien), them duong dan vao app/sitemap.js. Ham THUAN de test tay: engine/test/baoCao.test.mjs.
export const BAO_CAO = [
  {
    slug: "fpt",
    ma: "FPT",
    tenCongTy: "CTCP FPT",
    ngay: "20/11/2026",
    ngayIso: "2026-11-20",
    capNhat: "22/11/2026",
    tieuDe: "FPT: lợi nhuận lõi vẫn tăng, nhưng giá chưa đến vùng giải ngân",
    khuyenNghi: "MUA (chờ giá ≤ 42.000)",
    giaMucTieu: 65900,
    giaHienTai: 45000,
    moTa: "Báo cáo doanh nghiệp FPT: cập nhật KQKD quý 3/2026, chất lượng lợi nhuận quy về cổ phiếu, định giá từng phần, DCF, P/E, kịch bản stress và kế hoạch giải ngân 4 đợt khi giá xuống 42.000.",
    diem: [
      "LNST công ty mẹ quý 3 đạt 2.723 tỷ đồng (+11,8%), 9 tháng 7.778 tỷ đồng (+13,3% cùng cơ sở).",
      "Lãi lõi mỗi cổ phiếu khoảng 2.840 đồng so với EPS báo cáo 4.125 đồng; P/E lõi ~11,9x chứ không phải 8,2x.",
      "Dòng tiền tự do 9 tháng âm 1.077 tỷ đồng: lãi liên kết chưa ra tiền và vốn lưu động hút 4.226 tỷ đồng.",
      "Giá mục tiêu 65.900 đồng (+46%); kịch bản stress 41.300 đồng, nên chỉ giải ngân khi giá xuống 42.000.",
    ],
    html: "/bao-cao/fpt-2026-11.html",
    pdf: "/bao-cao/fpt-2026-11.pdf",
  },
];

export const layBaoCao = (slug) => BAO_CAO.find((b) => b.slug === String(slug || "").toLowerCase()) ?? null;
