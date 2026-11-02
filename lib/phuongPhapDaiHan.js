// PHUONG PHAP DAU TU DAI HAN (trang /dai-han) - ham THUAN (test tay: engine/test/phuongPhapDaiHan.test.mjs).
// Danh sach ma + gia tri hop ly: lib/phuongPhapDaiHanDuLieu.js (scripts/capNhatPhuongPhapDaiHan.mjs). Ket qua backtest: lib/phuongPhapDaiHanKetQua.js. Ma bi gan co rui ro: lib/coRuiRoDaiHan.js.

export const PHUONG_PHAP = {
  buffett: {
    khoa: "buffett",
    ten: "Doanh nghiệp tốt, giá hợp lý",
    nguoi: "Warren Buffett",
    moTa: "Doanh nghiệp có lợi thế bền: ROE cao nhiều năm, lợi nhuận không giảm, nợ vay thấp, định giá không quá đắt. Cầm lâu, chỉ bán khi doanh nghiệp xấu đi.",
    dieuKien: [
      "Vốn hóa từ 5.000 tỷ",
      "ROE từ 15% cả hiện tại và một năm trước",
      "Lợi nhuận 12 tháng không giảm so với cùng kỳ",
      "P/E không quá 20",
      "Doanh nghiệp phi tài chính: nợ vay không quá 0,8 lần vốn chủ, dòng tiền kinh doanh dương",
    ],
    locXuHuong: true, // chi giai ngan dot dau khi gia da tren duong can bang dai han (test: mat ~1%/nam, giam rui ro bat dao roi)
    ghiChuXuHuong: "Chỉ giải ngân khi giá đã đóng cửa trên đường cân bằng dài hạn. Test cho thấy bộ lọc này chỉ làm giảm lãi khoảng 1%/năm nhưng tránh được việc bắt mã còn đang giảm mạnh.",
  },
  coTuc: {
    khoa: "coTuc",
    ten: "Cổ tức tiền mặt cao",
    nguoi: "O'Shaughnessy / chiến lược Dogs of the Dow",
    moTa: "Doanh nghiệp lãi, chi cổ tức tiền mặt trong khả năng, tỷ suất cổ tức cao. Không phụ thuộc vào ngân hàng nên bổ sung tốt cho phương pháp Buffett.",
    dieuKien: [
      "Vốn hóa từ 5.000 tỷ, có lãi 12 tháng",
      "Chi cổ tức tiền mặt 12 tháng, không vượt lợi nhuận",
      "Loại tỷ suất trên 15% (thường là khoản chi một lần)",
      "Xếp theo tỷ suất cổ tức cao nhất",
    ],
    locXuHuong: false,
    ghiChuXuHuong: "Test cho thấy thêm bộ lọc xu hướng giá làm hỏng phương pháp này (lãi từ 9,6% xuống dưới 6%/năm), nên không áp dụng.",
  },
  graham: {
    khoa: "graham",
    ten: "Nhà đầu tư phòng thủ",
    nguoi: "Benjamin Graham",
    moTa: "Danh sách kiểm tra an toàn: doanh nghiệp lớn, thanh khoản tốt, lãi đều mọi quý, có cổ tức, định giá rẻ theo cả P/E lẫn P/B. Dùng như checklist trước khi mua một mã.",
    dieuKien: [
      "Vốn hóa từ 5.000 tỷ",
      "Lợi nhuận dương ở mọi quý trong 8 quý gần nhất có dữ liệu, lợi nhuận 12 tháng không giảm",
      "Có chi cổ tức tiền mặt 12 tháng",
      "P/E không quá 15 và P/E × P/B không quá 22,5",
      "Phi tài chính: thanh toán hiện hành từ 1,5, vay dài hạn không quá vốn lưu động",
    ],
    locXuHuong: false,
    ghiChuXuHuong: "Test cho thấy thêm bộ lọc xu hướng giá làm giảm lãi mạnh, nên không áp dụng.",
  },
  itBienDong: {
    khoa: "itBienDong",
    ten: "Ít biến động",
    nguoi: "Robert Haugen",
    moTa: "15 mã vốn hóa lớn có độ lệch chuẩn lợi suất thấp nhất 12 tháng. Lãi gần bằng VN-Index nhưng sụt giảm nhẹ hơn: dành cho người sợ dao động.",
    dieuKien: ["Vốn hóa từ 5.000 tỷ, có lãi 12 tháng", "Độ lệch chuẩn lợi suất ngày 250 phiên thấp nhất", "Không dùng làm phương pháp chính — lãi chỉ khoảng 3%/năm trong 2022–2026"],
    locXuHuong: false,
    ghiChuXuHuong: "",
  },
};

const so = (v) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
const lam2 = (x) => Math.round(x * 100) / 100;

// Mo hinh giai ngan 5 dot (moi dot 20% von), moi dot cho 1 muc gia (da kiem chung o nghienCuuChoVungGia.mjs: ve SMA50 khop ~65% / giam 10% ~41% / ve SMA200 ~39% / giam 20% ~16%).
// Hieu luc 3 thang: dot chua khop sau 3 thang thi mua theo thi truong (kem mua ngay khoang 1-3%, tot hon bo lo).
// Test cung cho thay CHO GIA KHONG TANG LOI NHUAN (mua ngay van tot nhat) - muc dich chi la kiem soat gia von, khong phai tim "day".
export const DOT_GIAI_NGAN = [
  { so: 1, ty: 20, nhan: "Mua ngay", khop: null },
  { so: 2, ty: 20, nhan: "Về SMA50", khop: 65 },
  { so: 3, ty: 20, nhan: "Giảm 10%", khop: 41 },
  { so: 4, ty: 20, nhan: "Về SMA200 hoặc giảm 15%", khop: 39 },
  { so: 5, ty: 20, nhan: "Giảm 20%", khop: 16 },
];
export const HAN_CHO_THANG = 3;

// gia: gia hien tai; sma50, sma200: duong trung binh (nghin dong); ggTop: duong can bang dai han (phan tren); locXuHuong: phuong phap yeu cau gia o tren ggTop truoc khi giai ngan.
// Tra ve { quaXuHuong, choGiaVuot (so | null), dot: [{ so, ty, nhan, khop, gia | null, ghiChu }] }.
export function lichGiaiNgan({ gia, sma50 = null, sma200 = null, ggTop = null, locXuHuong = false }) {
  const g = so(gia);
  if (!(g > 0)) return { quaXuHuong: false, choGiaVuot: null, dot: [] };
  const top = so(ggTop);
  const quaXuHuong = !locXuHuong || (top > 0 && g > top);
  if (!quaXuHuong) {
    // Chua qua xu huong: chua giai ngan dot nao, chi bao muc gia can vuot.
    return { quaXuHuong: false, choGiaVuot: top > 0 ? lam2(top) : null, dot: DOT_GIAI_NGAN.map((d) => ({ ...d, gia: null, ghiChu: d.so === 1 && top > 0 ? `Chờ giá đóng cửa trên ${lam2(top)}` : "Chưa bắt đầu" })) };
  }
  const s50 = so(sma50);
  const s200 = so(sma200);
  const ung = [g, s50 > 0 && s50 < g * 0.98 ? s50 : g * 0.97, g * 0.9, s200 > 0 && s200 < g * 0.88 ? s200 : g * 0.85, g * 0.8];
  const muc = [];
  ung.forEach((x, i) => muc.push(i === 0 ? x : Math.min(x, muc[i - 1] * 0.97))); // moi dot thap hon dot truoc it nhat 3%
  return {
    quaXuHuong: true,
    choGiaVuot: null,
    dot: DOT_GIAI_NGAN.map((d, i) => ({ ...d, gia: lam2(muc[i]), ghiChu: i === 0 ? "Giá hiện tại" : `${((muc[i] / g - 1) * 100).toFixed(1).replace(".", ",")}% so với giá hiện tại` })),
  };
}

// Nhan dinh gia theo r = gia / gia tri hop ly. r < 0,5: canh bao (thuong do loi nhuan bat thuong hoac doanh nghiep co van de) - xem lib/phuongPhapDaiHanKetQua.js.
export function nhanDinhGia(r) {
  const x = so(r);
  if (x == null) return { khoa: "khong", nhan: "—", mau: "mo" };
  if (x < 0.5) return { khoa: "canh_bao", nhan: "Rất rẻ — kiểm tra", mau: "vang" };
  if (x <= 0.8) return { khoa: "re", nhan: "Rẻ", mau: "xanh" };
  if (x <= 1.1) return { khoa: "hop_ly", nhan: "Hợp lý", mau: "chu" };
  return { khoa: "dat", nhan: "Đắt", mau: "do" };
}

// Gia hop ly theo gia hien tai: giaHopLy la gia moi CP (nghin dong) luc chay script; r tinh lai = gia hien tai / giaHopLy.
export function tyLeGiaTrenHopLy(gia, giaHopLy) {
  const g = so(gia);
  const h = so(giaHopLy);
  return g > 0 && h > 0 ? g / h : null;
}

// Loc bo ma bi gan co rui ro (quan tri) khoi danh sach, tra { ds, daLoai: [{ ma, lyDo, ngay }] }.
export function loaiMaRuiRo(ds = [], coRuiRo = {}) {
  const daLoai = [];
  const giu = [];
  for (const m of ds) {
    const c = coRuiRo[m.ma];
    if (c) daLoai.push({ ma: m.ma, lyDo: c.lyDo, ngay: c.ngay });
    else giu.push(m);
  }
  return { ds: giu, daLoai };
}

// Khung loi + ve tinh: gan tung ma (da loai rui ro) voi ty trong, ty trong chia lai cho du 65 / 35 khi mot so ma bi loai.
export function chiaKhungLoiVeTinh({ loi = [], veTinh = [], tyLoi = 65, tyVeTinh = 35 }) {
  const chia = (ds, ty) => ds.map((m) => ({ ...m, ty: ds.length ? Math.round((ty / ds.length) * 10) / 10 : 0 }));
  return { loi: chia(loi, tyLoi), veTinh: chia(veTinh, tyVeTinh) };
}
