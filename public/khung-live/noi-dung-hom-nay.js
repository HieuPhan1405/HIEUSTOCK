// ============================================================
//  SỬA NỘI DUNG HÔM NAY Ở ĐÂY (mở bằng Notepad, sửa chữ trong dấu " ", rồi lưu lại)
//  - Bản chuyển động (khung-live.html / khung-doc.html): tải lại trang là thấy nội dung mới.
//  - Ảnh PNG: bấm đúp TAO_ANH_PNG.bat (khung ngang) hoặc TAO_ANH_PNG_DOC.bat (khung dọc) để tạo lại ảnh.
//  - Cách dễ hơn: dùng trang soạn nội dung trên web (xem HUONG_DAN.txt), không cần sửa file này.
// ============================================================
window.KHUNG_LIVE = {
  // Tên kênh hiện to ở đầu khung
  kenh: "Phan Hiếu Stock",

  // Link ảnh avatar cho KHUNG DỌC (để nguyên avatar.png nếu đặt file avatar.png cạnh khung-doc.html)
  avatar: "avatar.png",

  // 3 dòng chữ nhỏ dưới tên kênh, luân phiên hiện lần lượt
  phuDe: [
    "Chứng khoán · CloudStock",
    "Bấm THEO DÕI để không lỡ buổi live"
  ],

  // Tiêu đề khu vực nội dung (cạnh con Mây)
  tieuDe: "NỘI DUNG HÔM NAY",

  // Các mục của buổi live hôm nay (tối đa 6 mục, mỗi mục nên dưới ~45 chữ).
  // MÂY SẼ ĐỌC LẦN LƯỢT từng mục ("Nội dung 1: ...") và ô số 1 2 3 4 sáng lên theo mục đang đọc.
  muc: [
    "Nhận định thị trường hôm nay",
    "Tín hiệu Mua – Bán trong ngày",
    "Cách dùng bộ lọc chỉ báo",
    "Giải đáp câu hỏi mọi người"
  ],

  // Lời Mây nói THÊM: câu ĐẦU TIÊN là câu chào (nói trước khi đọc nội dung), các câu sau nói sau khi đọc xong nội dung.
  mayNoi: [
    "Chào cả nhà! Cùng Phan Hiếu Stock xem thị trường nhé!",
    "Nhớ bấm theo dõi Phan Hiếu Stock để không lỡ buổi live sau nha!",
    "Đầu tư có rủi ro, thông tin chỉ để tham khảo thôi nha!"
  ],

  // Mã môi giới MBS (hiện ở KHUNG TỐI GIẢN: khung-toi-gian.html)
  mbs: "7VZI",

  // Web hiện ở thẻ trong khung
  web: "cloudstock.id.vn",

  // Dòng chữ chạy ở thanh dưới màn hình (chỉ có ở khung ngang)
  chay: [
    "Thông tin tham khảo, không phải khuyến nghị đầu tư",
    "Mọi quyết định mua bán do nhà đầu tư tự chịu trách nhiệm",
    "Dùng thử miễn phí tuần đầu tại cloudstock.id.vn"
  ]
};
