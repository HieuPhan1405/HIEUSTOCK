// DANH SACH BAO CAO PHAN TICH (cap nhat 23/11/2026) - muc "Bao cao phan tich" (/bao-cao). Moi bao cao la 1 file HTML tinh + 1 file PDF trong public/bao-cao/ (sinh tu
// Desktop/Phan-Tich-Co-Ban: taoBaoCaoDN_FPT.mjs cho FPT, BC3/taoBC3.mjs cho VCB/TCB/ACV/HAH), trang /bao-cao/[slug] nhung file HTML bang khung (components/KhungBaoCao.js).
// Them bao cao moi: copy 2 file vao public/bao-cao/ (ban HTML them <base target="_blank"><meta name="robots" content="noindex"> vao <head>), them 1 phan tu vao BAO_CAO
// (moi nhat dau tien), them duong dan vao app/sitemap.js.
export const BAO_CAO = [
  {
    slug: "hah",
    ma: "HAH",
    tenCongTy: "CTCP Vận tải và Xếp dỡ Hải An",
    ngay: "20/11/2026",
    ngayIso: "2026-11-20",
    capNhat: "23/11/2026",
    tieuDe: "HAH: lợi nhuận 9 tháng +11%, nhưng bước nhảy của 10 tàu mới nằm ở 2028–2029",
    khuyenNghi: "TRUNG LẬP (MUA khi giá ≤ 43.000)",
    nhanGia: "Giá trị hợp lý",
    giaMucTieu: 49500,
    giaHienTai: 45700,
    moTa: "Báo cáo doanh nghiệp HAH: kết quả quý 3/2026, kế hoạch 10 tàu mới 2027–2029, triển vọng giá thuê tàu, vốn đầu tư và rủi ro pha loãng, định giá P/B–ROE, kịch bản giá thuê và kế hoạch giải ngân 3 đợt khi giá về vùng an toàn.",
    diem: [
      "LNST công ty mẹ quý 3 đạt 328,5 tỷ đồng (+8,1%), 9 tháng 1.001 tỷ đồng (+11,3%), bằng 80% kế hoạch 2026 của doanh nghiệp.",
      "10 tàu đóng mới (~602 triệu USD) chủ yếu về 2028–2029; năm 2027 chỉ có tàu 3.000 TEU đầu tiên (12/2027), nên VNDirect dự phóng LNST 2027 chỉ +5%.",
      "Rủi ro dồn về 2028: giá thuê tàu có thể giảm khi tàu lớn dồn xuống tuyến ngắn; mỗi −10% giá thuê làm LNST 2027 giảm ~206 tỷ đồng (−15%).",
      "Giá trị hợp lý 49.500 đồng (+8%), chuyển MUA khi giá ≤ 43.000; stress 29.600; chưa tính pha loãng từ trái phiếu kèm chứng quyền (tối đa ~188 triệu cổ phiếu).",
    ],
    html: "/bao-cao/hah-2026-11.html",
    pdf: "/bao-cao/hah-2026-11.pdf",
  },
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
  {
    slug: "tcb",
    ma: "TCB",
    tenCongTy: "NH TMCP Kỹ thương Việt Nam",
    ngay: "20/11/2026",
    ngayIso: "2026-11-20",
    capNhat: "23/11/2026",
    tieuDe: "TCB: lợi nhuận +18% nhờ dự phòng giảm, giá chỉ 1,25 lần giá trị sổ sách",
    khuyenNghi: "MUA (giải ngân từng đợt)",
    nhanGia: "Giá trị hợp lý",
    giaMucTieu: 25100,
    giaHienTai: 21200,
    moTa: "Báo cáo doanh nghiệp TCB: kết quả quý 3/2026, chất lượng tài sản, so sánh với VCB, triển vọng 2027–2028 so với kế hoạch 2026, định giá P/B–ROE, kịch bản stress và kế hoạch giải ngân 4 đợt.",
    diem: [
      "LNST công ty mẹ quý 3 đạt 7.943 tỷ đồng (+23,7%), 9 tháng 21.964 tỷ đồng (+18,0%).",
      "Lợi nhuận trước thuế +25,8% nhanh hơn thu nhập lãi thuần (+17,9%) nhờ chi phí dự phòng giảm 38,8%; nợ xấu tăng lên 1,27% (ngân hàng công bố 1,36%), bao phủ 107%.",
      "Kế hoạch 2026 (LNTT 35.000–37.500 tỷ đồng) đã đạt 77–83% sau 9 tháng; không chia cổ tức tiền mặt, tăng vốn bằng cổ phiếu 100:50.",
      "P/B 1,25x, P/E 7,9x; giá trị hợp lý 25.100 đồng (+18%), kịch bản stress 17.600 đồng; giải ngân từng đợt.",
    ],
    html: "/bao-cao/tcb-2026-11.html",
    pdf: "/bao-cao/tcb-2026-11.pdf",
  },
];

export const layBaoCao = (slug) => BAO_CAO.find((b) => b.slug === String(slug || "").toLowerCase()) ?? null;
