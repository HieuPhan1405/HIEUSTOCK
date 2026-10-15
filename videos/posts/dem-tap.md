# Bộ đếm chuyên mục Facebook

Mỗi lần chạy lịch 07:00: **đọc file này, dùng số "Tiếp theo" cho bài tương ứng, rồi cập nhật bảng và commit cùng bài.** Số tuần theo ISO (tuần 39 = 21–25/9/2026, khớp cách TVSI đánh số).

| Chuyên mục | Dùng ở đâu | Đã dùng | Tiếp theo |
|---|---|---|---|
| TỔNG KẾT TUẦN <ISO> | Bài 1 (chỉ đặt số tuần khi tổng kết đúng một tuần giao dịch đã đủ) | Tuần 41 (5–9/10), đăng 12/10 | Tuần 42 (12–16/10), đăng từ 19/10; số tuần: `date +%V` của thứ Hai của tuần được tổng kết |
| KIẾN THỨC 60 GIÂY #n | Bài 4 | 12/10: chia cổ phiếu 30% (coi là #1; lời đăng chưa gắn số, thêm "#1" vào dòng đầu khi đăng nếu muốn); 13/10: #2 đáo hạn phái sinh 15/10; 14/10: #3 ba chỉ số (VN-Index, VN30, HNX-Index); 15/10: #4 biên độ ±7% | #5 |
| LỘT TRẦN NGHỀ MÔI GIỚI #n | Bài 5 (dạng luận điểm của series; dạng "Nếu là bạn thì sao?" và trả lời câu hỏi cũng đánh số chung) | 12/10: "Mã này mai có lên không?" (coi là #1, chưa gắn số); 13/10: #2 thanh khoản giảm, margin tăng (dạng "Nếu là bạn thì sao?"); 14/10: #3 "tin nội bộ" (dạng "Nếu là bạn thì sao?"); 15/10: #4 "môi giới giỏi thì tự giàu" (dạng luận điểm series) | #5 |

**Quy tắc:**
- Gắn nhãn đúng ở **đầu tiêu đề trên ảnh** và **dòng đầu lời đăng**, ví dụ "KIẾN THỨC 60 GIÂY #2 | …". Nhãn ngắn, không thay hook.
- Video của series "Lột trần nghề môi giới" (kịch bản trong `videos/scripts/series-*.md`) chưa đánh số tập; số tập video do Hiếu chọn thứ tự. Bộ đếm này chỉ cho bài Facebook.
- Bài không đạt kiểm chứng và bị bỏ thì **không dùng số**, không nhảy số.
- Ngày thường bài 1 là **tổng kết phiên hôm trước** (không đánh số). Số "TỔNG KẾT TUẦN" chỉ dùng khi tổng kết đủ một tuần giao dịch (ngày nghỉ hoặc thứ Hai sau tuần đủ).
